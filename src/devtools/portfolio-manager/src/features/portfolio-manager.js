import { Feature } from '@skypager/node'
import md5File from 'md5-file'

/**
 * @class PortfolioManager
 * @extends Feature
 * @classdesc The PortfolioManager can be used by any monorepo, and provides a way of
 * accessing each project, extracting info from it, running tasks inside of it, etc.
 */
export default class PortfolioManager extends Feature {
  static shortcut = 'portfolio'

  static runtimes = new Map()

  /**
   * When the feature is enabled, it locates the portfolio repo
   * and attaches references to the portfolio's packageManager, moduleManager, fileManager
   * to the portfolio instance.
   */
  async featureWasEnabled() {
    await this.attachPortfolioManagers()
    return this
  }

  get version() {
    return this.portfolioRuntime.currentPackage.version
  }

  get packageName() {
    return this.portfolioRuntime.currentPackage.name
  }

  get cwd() {
    return this.portfolioRuntime.cwd
  }

  get manifest() {
    return this.portfolioRuntime.currentPackage
  }

  observables() {
    return {
      status: 'CREATED',
      projects: ['shallowMap', []],
      updateProject: ['action', PortfolioManager.prototype.updateProject],
      projectTable: ['computed', PortfolioManager.prototype.getProjectTable],
    }
  }

  async whenReady() {
    if (this.status === 'READY') {
      return this
    }

    return new Promise((resolve, reject) => {
      if (this.status === 'CREATED') {
        this.startAsync()
          .then(() => {
            resolve(this)
          })
          .catch(error => reject(error))
        return
      }

      this.once('ready', () => resolve(this))
      this.once('failed', error => reject(error))
    })
  }

  get projectInfo() {
    return this.scopedPackageNames.map(packageName => {
      const pkg = this.packageManager.findByName(packageName)
      return {
        name: pkg.name,
        description: pkg.description,
        version: pkg.version,
        main: pkg.main,
        browser: pkg.browser,
        native: pkg.native,
        module: pkg.module,
        esNextMain: pkg['esnext:main'],
      }
    })
  }
  /**
   * Generate a graph structure from the moduleManager node_module manifests
   *
   * @returns {ModuleGraph}
   */
  async modulesGraph(options = {}) {
    if (this.moduleManager.status !== 'READY') {
      await this.moduleManager.startAsync(options)
    }

    return this.moduleManager.exportGraph(options)
  }

  /**
   * Generate a graph structure from the packageManager projects
   *
   * @returns {PackageGraph}
   */
  packageGraph(options = {}) {
    return this.packageManager.exportGraph(options)
  }

  /**
   * Generate a dump of the source and build tree information for every project in the portfolio
   *
   * @returns {PortfolioState}
   */
  async dump(options = {}) {
    await this.hashProjectTrees(options)

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

  /**
   * @private
   * @returns {ProjectTable}
   * @memberof PortfolioManager
   */
  getProjectTable() {
    return this.projects.toJSON()
  }

  /**
   * @private
   * @returns {PortfolioManager}
   * @memberof PortfolioManager
   */
  updateProject(projectName, attributes = {}) {
    const currentValue = this.projects.get(projectName) || {}

    this.projects.set(projectName, {
      ...currentValue,
      ...attributes,
    })

    return this
  }

  /**
   * Returns the names of the package which match the portfolio scope
   * @type {Array<String>}
   * @readonly
   * @memberof PortfolioManager
   */
  get scopedPackageNames() {
    const {
      currentPackage: { name },
    } = this.portfolioRuntime
    const { packageNames = [] } = this.packageManager

    const scope = name.split('/')[0]

    return packageNames.filter(
      packageName => packageName.startsWith(scope) || `@${packageName}` === scope
    )
  }

  /**
   *  Find the last modified git sha, and the commit message for a given project
   *
   * @param {String} packageName
   * @returns {sha: String, message: String }
   * @memberof PortfolioManager
   */
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

  /**
   * Given a project, we will give you the md5 hash of every file in the build folder,
   * as well as size and timestamp information for each file.  We will also calculate a composite md5 hash
   * from all of the build artifacts and their hashes.
   *
   * @param {String} projectName
   * @param {Object} [options={}]
   * @param {String} [options.baseFolder='lib'] the build folder that contains your output files
   * @returns {BuildTreeMetadata}
   * @memberof PortfolioManager
   */
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
        name: this.portfolioRuntime.pathUtils.relative(baseFolder, file.path),
        mimeType: file && file.mime && file.mime.mimeType,
        hash,
      })),
    })

    return this.projects.get(projectName)
  }

  /**
   * Given a project, we will give you metadata about the state of the source files in that tree.
   *
   * @param {String} projectName the name of the project you wish to calculate a source hash for
   * @param {Object} [options={}]
   * @returns {SourceTreeMetadata}
   * @memberof PortfolioManager
   */
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

    return this.projects.get(projectName)
  }

  /**
   * Restores the build folders for a portfolio project from the tarball archives
   *
   * @param {String} packageName
   * @param {Object} [options={}] options for the restore
   * @param {Boolean} [options.overwrite=false] whether to override the contents that are already there
   * @memberof PortfolioManager
   */
  async restore(packageName, requestedVersion, options = {}) {
    const { buildFolders = ['build', 'dist', 'lib'] } = options
    const { packageManager, runtime } = this

    const remote = packageManager.remotes.get(packageName)
    const local = packageManager.findByName(packageName)

    if (!local) {
      throw new Error(`Could not restore package ${packageName}, not found in package manager`)
    }

    if (!remote) {
      return
    }

    const { dir } = local._file

    const { version = requestedVersion, name } = remote

    const localTarballPath = runtime.resolve(
      'build',
      ...name.split('/').concat([version, `package-${version}.tgz`])
    )

    const extractPath = runtime.resolve('build', ...name.split('/').concat([version]))

    const tarballExists = await runtime.fsx.existsAsync(localTarballPath)

    if (!tarballExists) {
      await this.downloadTarball(remote)
    }

    const { intersection } = this.lodash
    const extracted = await this.extractTarball(remote)

    const extractedBuildFolders = intersection(
      extracted,
      buildFolders.map(f => runtime.resolve(extractPath, f))
    )

    const { basename } = this.runtime.pathUtils

    const restoredFolders = await Promise.all(
      extractedBuildFolders.map(buildFolderPath =>
        runtime.fsx
          .copyAsync(buildFolderPath, runtime.resolve(dir, basename(buildFolderPath)))
          .then(() => runtime.resolve(dir, basename(buildFolderPath)))
      )
    )

    return restoredFolders
  }

  /**
   * Calculate the build hash, source hash, and latest git commit info
   * for a given set of projects in the portfolio
   *
   * @param {Object} [options={}]
   * @param {Array<String>} [options.projects] a list of project names to calculate hashes for
   * @returns
   * @memberof PortfolioManager
   */
  async hashProjectTrees(options = {}) {
    const { projects = this.scopedPackageNames } = options
    await Promise.all(projects.map(projectName => this.hashProjectTree(projectName, options)))
    await Promise.all(projects.map(projectName => this.hashBuildTree(projectName, options)))
    await Promise.all(projects.map(projectName => this.findLastModifiedSha(projectName, options)))
    return this.projectTable
  }

  async dumpFileTree(projectName, options = {}) {
    const { artifacts = false } = options
    const runtime = this.createRuntime(projectName)

    const fm = runtime.fileManager

    await fm.startAsync()
    await fm.readAllContent()
    await fm.hashFiles()

    return fm.fileObjects
      .map(file => ({
        ...file,
        path: file.path.replace(file.dir, '~'),
        dir: '~',
      }))
      .filter(({ relative }) => artifacts || !relative.match(/^(lib|dist|build)/i))
  }

  /**
   * Create a runtime for a project in the portfolio
   *
   * @param {String} packageName
   * @param {Object} [options={}]
   * @param {Object} [context={}]
   * @param {Function} middleWareFn
   * @returns {Runtime}
   * @memberof PortfolioManager
   */
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

  /**
   * Provides access to the git feature for the portfolio
   *
   * @readonly
   * @type {GitFeature}
   * @memberof PortfolioManager
   */
  get git() {
    return this.get('fileManager.git')
  }

  /**
   * Provides access to the fileManager for the portfolio
   * @type {FileManager}
   */
  get fileManager() {
    return this.get('managers.fileManager')
  }

  /**
   * Provides access to the packageManager for the portfolio
   * @type {PackageManager}
   */
  get packageManager() {
    return this.get('managers.packageManager')
  }

  /**
   * Provides access to the moduleManager for the portfolio
   * @type {ModuleManager}
   */
  get moduleManager() {
    return this.get('managers.moduleManager')
  }

  /**
   * Start the various services the portfolioManager depends on to learn about the project
   * @param {Object} [options={}]
   * @param {Number} [options.maxDepth=1] the maximum depth for modules to consider part of the portfolio.
   * @param {Boolean} [options.moduleManager=false] whether to start the module manager service
   * @triggers PortfolioManager#ready
   * @triggers PortfolioManager#failed
   * @returns {PortfolioManager}
   * @memberof PortfolioManager
   */
  async startAsync(options = {}) {
    const { fileManager } = this
    const { packageManager } = this
    const { maxDepth = 1, moduleManager = false } = options

    if (fileManager.status === 'READY' && packageManager.status === 'READY') {
      this.emit('ready')
      this.status = 'READY'
      return this
    }

    if (this.status === 'READY') {
      return this
    } else if (this.status === 'STARTING') {
      return new Promise((resolve, reject) => {
        this.once('ready', () => resolve(this))
        this.once('failed', error => reject(error))
      })
    }

    this.status = 'STARTING'

    await fileManager.startAsync({ startPackageManager: true }).catch(error => {
      this.status = 'FAILED'
      /**
       * @event failed
       * @param {Error} error error emitted that caused the file manager to fail
       */
      this.emit('failed', error)
      throw error
    })

    if (moduleManager !== false) {
      await this.moduleManager.startAsync({ maxDepth }).catch(error => {
        this.status = 'FAILED'
        /**
         * @event PortfolioManager#failed
         * @param {Error} error error emitted that caused the module manager to fail
         */
        this.emit('failed', error)
        throw error
      })
    }

    /**
     * @event PortfolioManager#ready
     */
    this.emit('ready')
    this.status = 'READY'

    return this
  }

  /**
   * @private
   */
  async attachPortfolioManagers(options = {}) {
    if (!options.refresh && this.managers) {
      return this.managers
    }

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

  /**
   * Extracts the downloaded tar archive from npm for a package
   *
   * @private
   * @param {Object} [remote={ name, version }={}]
   * @param {Object} [options={}]
   * @memberof PortfolioManager
   */
  async extractTarball({ name, version } = {}, options = {}) {
    const { runtime } = this
    const destination = runtime.resolve('build', name, version, `package-${version}.tgz`)
    const exists = await runtime.fsx.existsAsync(destination)
    const folder = runtime.pathUtils.dirname(destination)

    if (exists) {
      await runtime.proc.async.spawn('tar', ['zxvf', destination], {
        cwd: folder,
      })

      const items = await runtime.fsx.readdirAsync(runtime.resolve(folder, 'package'))

      if (items.indexOf('lib') !== -1) {
        await runtime.fsx.copyAsync(
          runtime.resolve(folder, 'package', 'lib'),
          runtime.resolve(folder, 'lib')
        )
      }

      if (items.indexOf('dist') !== -1) {
        await runtime.fsx.copyAsync(
          runtime.resolve(folder, 'package', 'dist'),
          runtime.resolve(folder, 'dist')
        )
      }

      if (items.indexOf('build') !== -1) {
        await runtime.fsx.copyAsync(
          runtime.resolve(folder, 'package', 'build'),
          runtime.resolve(folder, 'build')
        )
      }

      await runtime.fsx.copyAsync(
        runtime.resolve(folder, 'package', 'package.json'),
        runtime.resolve(folder, 'package.json')
      )
    }

    if (options.clean !== false) {
      await runtime.fsx.removeAsync(runtime.resolve(folder, 'package'))
    }

    const entries = await runtime.fsx.readdirAsync(runtime.resolve(folder))

    return entries.map(e => runtime.resolve(folder, e))
  }

  /**
   * Downloads a tar archive of a package from npm
   *
   * @private
   * @param {Object} [{ name, version, dist: { tarball } }={}]
   * @returns {String}
   * @memberof PortfolioManager
   */
  async downloadTarball({ name, version, dist: { tarball } } = {}) {
    const { runtime } = this
    const destination = runtime.resolve('build', name, version, `package-${version}.tgz`)
    const exists = await runtime.fsx.existsAsync(destination)

    if (exists) {
      return destination
    }

    const folder = runtime.pathUtils.dirname(destination)

    await runtime.fsx.mkdirpAsync(folder)
    await runtime.fileDownloader.downloadAsync(tarball, runtime.relative(destination))

    return destination
  }
}

/**
 * @typedef {Object} ModuleGraph
 * @param {Array} edges
 * @param {Array} nodes
 */

/**
 * @typedef {Object} PackageGraph
 * @param {Object} graph
 * @param {Array} graph.nodes
 * @param {Array} graph.edges
 */

/**
 * @typedef {Object} PortfolioState
 * @param {ProjectTable} projectTable project level metadata containing info about the sourceTree, buildTree, and git state
 * @param {String} packageHash an md5 hash of the package.json contents
 * @param {String} yarnLockHash an md5 hash of the lerna.json contents
 * @param {String} name the name of the package
 * @param {String} version the version of the package
 * @param {String} gitSha the current git sha at the time of the dump
 * @param {String} gitBranch the current git branch at the time of the dump
 * @param {String} platform the platform of the machine generating the dump
 * @param {String} arch the architecture of the machine generating the dump
 * @param {String} lernaVersion  if the portfolio uses lerna, which version is it set to
 * @param {Array<String>} lernaPackages  if the portfolio uses lerna, which package patterns are used
 */

/**
 * @typedef {Object} OutputFileMetadata
 * @param {Number} size
 * @param {Number} createdAt
 * @param {String} name the name of the file, relative to the build folder itself
 * @param {String} mimeType the mime type of the file
 * @param {String} hash the md5 hash of the file
 */
/**
 * @typedef {Object} ProjectStats
 * @param {String} sourceHash a composite md5 hash of the source files and their md5 hashes
 * @param {String} buildHash a composite md5 hash of the build artifacts and their md5 hashes
 * @param {String} sha the current git sha at the time of generating this data
 * @param {String} sha the current git branch at the time of generating this data
 * @param {String} projectName the name of the project
 * @param {String} version the project's version number
 * @param {Array<OutputFileMetadata>} outputFiles an array of output files and useful metadata about them
 * @param {Object} lastUpdate
 * @param {String} lastUpdate.sha the last git sha that touched this project
 * @param {String} lastUpdate.message the last git commit message that touched this project
 */
/**
 * @typedef {Object<string,ProjectStats>} ProjectTable
 */

/**
 * @typedef {Object} SourceTreeMetadata
 * @param {String} sourceHash
 */

/**
 * @typedef {Object} BuildTreeMetadata
 * @param {String} buildHash
 * @param {Array<OutputFileMetadata>} outputFiles
 */
