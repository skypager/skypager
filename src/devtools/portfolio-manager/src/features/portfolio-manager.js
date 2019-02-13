import { Feature } from '@skypager/node'
import md5File from 'md5-file'

export default class PortfolioManager extends Feature {
  static shortcut = 'portfolio'

  static runtimes = new Map()

  async dump(options = {}) {
    await this.hashProjectTrees()

    const { portfolioRuntime } = this

    const packageHash = await new Promise((resolve, reject) =>
      md5File(portfolioRuntime.resolve('package.json'), (err, hash) =>
        err ? reject(err) : resolve(hash)
      )
    )

    const yarnLockHash = await new Promise((resolve, reject) =>
      md5File(portfolioRuntime.resolve('yarn.lock'), (err, hash) =>
        err ? reject(err) : resolve(hash)
      )
    )

    const data = {
      projectTable: this.projectTable,
      packageHash,
      yarnLockHash,
      name: portfolioRuntime.currentPackage.name,
      version: portfolioRuntime.currentPackage.version,
      gitSha: portfolioRuntime.gitInfo.sha,
      gitBranch: portfolioRuntime.gitInfo.branch,
      platform: portfolioRuntime.os.platform,
      arch: portfolioRuntime.os.arch,
    }

    if (portfolioRuntime.packageManager.usesLerna) {
      const lernaConfig = await portfolioRuntime.fsx.readJsonAsync(
        portfolioRuntime.resolve('lerna.json')
      )
      data.lernaVersion = lernaConfig.version
      data.lernaPackages = lernaConfig.packages
    }

    return data
  }

  observables() {
    return {
      projects: ['shallowMap', []],
      updateProject: ['action', PortfolioManager.prototype.updateProject],
      projectTable: ['computed', PortfolioManager.prototype.getProjectTable],
    }
  }

  getProjectTable() {
    return this.projects.toJSON()
  }

  updateProject(projectName, attributes = {}) {
    const currentValue = this.projects.get(projectName) || {}

    this.projects.set(projectName, {
      ...currentValue,
      ...attributes,
    })

    return this
  }

  get scopedPackageNames() {
    const {
      currentPackage: { name },
    } = this.portfolioRuntime
    const { packageNames = [] } = this.packageManager

    const scope = name.split('/')[0]

    return packageNames.filter(packageName => packageName.startsWith(scope))
  }

  async findLastModifiedSha(packageName) {
    const entry = this.packageManager.findByName(packageName)

    if (!entry) {
      throw new Error(`Could not locate package: ${packageName}`)
    }

    const { relativeDirname } = entry._file

    const { normalOutput } = await this.portfolioRuntime.proc.spawnAndCapture({
      cmd: 'git',
      args: ['log', '--oneline', relativeDirname],
    })

    const lastCommit = normalOutput.join('').split('\n')[0]

    const parts = lastCommit.split(' ')

    const lastUpdate = {
      sha: parts.shift(),
      message: parts.join(' '),
    }

    this.updateProject(packageName, { lastUpdate })

    return lastUpdate
  }

  async hashBuildTree(projectName, options = {}) {
    const runtime = this.createRuntime(projectName)
    const { baseFolder = runtime.resolve('lib') } = options

    const buildFolderExists = await runtime.fsx.existsAsync(baseFolder)

    if (!buildFolderExists) {
      return {}
    }

    const walker = runtime.skywalker.projectWalker({
      baseFolder,
      bare: true,
    })

    const tree = await new Promise((resolve, reject) => {
      walker.start((err, tree) => {
        err ? reject(err) : resolve(tree)
      })
    })

    const files = []

    function visit(node) {
      const { _: info } = node

      if (info.isDirectory) {
        info.children.map(node => visit(node))
      } else {
        files.push(info)
      }
    }

    visit(tree)

    const hashedFiles = await Promise.all(
      files.map(
        file =>
          new Promise((resolve, reject) =>
            md5File(file.path, (err, hash) => (err ? reject(err) : resolve({ file, hash })))
          )
      )
    )

    const buildHash = this.runtime.hashObject(hashedFiles.map(e => e.hash))

    this.updateProject(projectName, {
      buildHash,
      outputFiles: hashedFiles.map(({ file, hash }) => ({
        size: file.size,
        createdAt: file.birthtime,
        name: this.runtime.pathUtils.relative(baseFolder, file.path),
        mimeType: file && file.mime && file.mime.mimeType,
        hash,
      })),
    })
  }

  async hashProjectTree(projectName, options = {}) {
    const runtime = this.createRuntime(projectName)
    const { sha, branch } = runtime.gitInfo

    const fm = runtime.fileManager
    await fm.startAsync()
    const sourceHash = await fm.hashTree()

    this.updateProject(projectName, {
      sourceHash,
      sha,
      branch,
      version: runtime.currentPackage.version,
      projectName,
    })

    return sourceHash
  }

  async hashProjectTrees(options = {}) {
    const { projects = this.scopedPackageNames } = options
    await Promise.all(projects.map(projectName => this.hashProjectTree(projectName, options)))
    await Promise.all(projects.map(projectName => this.hashBuildTree(projectName, options)))
    await Promise.all(projects.map(projectName => this.findLastModifiedSha(projectName, options)))
    return this.projectTable
  }

  createRuntime(packageName, options = {}, context = {}, middleWareFn) {
    if (this.constructor.runtimes.has(packageName)) {
      return this.constructor.runtimes.get(packageName)
    }

    const entry = this.packageManager.findByName(packageName)

    if (!entry) {
      throw new Error(`Could not locate package: ${packageName}`)
    }

    const { dir } = entry._file

    const newRuntime = this.runtime.spawn({ ...options, cwd: dir }, context, middleWareFn)

    this.constructor.runtimes.set(packageName, newRuntime.use('runtimes/node').fileManager.runtime)

    return newRuntime
  }

  get git() {
    return this.get('fileManager.git')
  }

  /**
   * @type {FileManager}
   */
  get fileManager() {
    return this.get('managers.fileManager')
  }

  /**
   * @type {PackageManager}
   */
  get packageManager() {
    return this.get('managers.packageManager')
  }

  /**
   * @type {ModuleManager}
   */
  get moduleManager() {
    return this.get('managers.moduleManager')
  }

  async featureWasEnabled() {
    await this.attachPortfolioManagers()
    await this.fileManager.startAsync({ startPackageManager: true })
    await this.moduleManager.startAsync({ maxDepth: 1 })
  }

  /**
   * @private
   */
  async attachPortfolioManagers() {
    const { runtime } = this
    const { isNull } = this.lodash
    const parentPackage = await this.runtime.packageFinder.findParentPackage()

    let portfolio

    if (isNull(parentPackage)) {
      portfolio = runtime
    } else {
      portfolio = runtime
        .spawn({ cwd: runtime.pathUtils.dirname(parentPackage) })
        .use('runtimes/node')
    }

    this.hide('portfolioRuntime', portfolio)
    await portfolio.start()

    const { fileManager } = portfolio

    const managers = {
      fileManager,
      packageManager: portfolio.feature('package-manager'),
      moduleManager: portfolio.feature('module-manager'),
    }

    this.hide('managers', managers)

    return managers
  }
}
