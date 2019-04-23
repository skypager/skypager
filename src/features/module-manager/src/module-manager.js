import { Feature } from '@skypager/node'
import pacote from 'pacote'

/**
 * @class ModuleManager
 * @classdesc The ModuleManager provides a database like API on top of the package.json found in the NODE_MODULES resolution path of the project
 */
export default class ModuleManager extends Feature {
  static shortcut = 'moduleManager'

  observables() {
    const p = this

    return {
      status: CREATED,

      manifests: ['shallowMap', {}],

      remotes: ['shallowMap', []],

      updateNodeModule: [
        'action',
        function(pkg) {
          p.manifests.set(pkg.name, {
            ...(p.manifests.get(pkg.name) || {}),
            [pkg.version]: p.normalizePackage(pkg),
          })

          return this
        },
      ],

      updateRemote: [
        'action',
        function(name, data) {
          p.remotes.set(name, p.normalizePackage(data))
        },
      ],

      remoteData: [
        'computed',
        function() {
          return this.chain
            .result('remotes.toJSON', {})
            .mapValues(v => this.runtime.convertToJS(v))
            .value()
        },
      ],

      checkRemoteStatus: [
        'action',
        function(name) {
          if (p.remotes.has(name)) {
            return p.remotes.get(name)
          }
          return this.checkRepo(name).then(result => {
            if (result && typeof result === 'object' && result.name && result.version) {
              p.updateRemote(name, result)
            }

            return result
          })
        },
      ],
    }
  }

  /**
   * An array of the module ids found in the module manager
   *
   * @type {Array<String>}
   * @readonly
   * @memberof ModuleManager
   */
  get packageIds() {
    return this.manifests.keys()
  }

  /**
   * Gets the latests manifest for each package in the module manager
   *
   * @type {Array<PackageManifest>}
   * @readonly
   * @memberof ModuleManager
   */
  get latestPackages() {
    return this.packageIds.map(id => this.findLatestByName(id))
  }

  /**
   * Gets every manifest for every package, including multiple versions, found in the NODE_MODULES resolution paths
   *
   * @type {Array<PackageManifest>}
   * @readonly
   * @memberof ModuleManager
   */
  get packageData() {
    return this.chain
      .result('manifests.values', [])
      .values()
      .map(v => Object.values(v))
      .flatten()
      .uniqBy(v => `${v.name}.${v.version}`)
      .value()
  }

  /**
   * A unique list of all names of packages found in the module manager
   *
   * @readonly
   * @memberof ModuleManager
   */
  get packageNames() {
    return this.packageIds
  }

  /**
   * Gets all of the module manager manifests in entries form
   *
   * @type {Array<Array>}
   * @readonly
   * @memberof ModuleManager
   */
  get entries() {
    return this.manifests.entries().map(v => [v[0], this.runtime.convertToJS(v[1])])
  }

  get byName() {
    return this.chain
      .get('packageData')
      .keyBy(v => v.name)
      .value()
  }

  get finder() {
    return this.runtime.packageFinder
  }

  normalizePackage(manifest) {
    const { defaults } = this.lodash

    return defaults(manifest, {
      keywords: [],
      description: '',
      author: '',
      contributors: [],
      scripts: {},
    })
  }

  start(options = {}, cb) {
    if (typeof cb !== 'function') {
      return this.startAsync(options)
    }

    this.startAsync(options)
      .then(() => {
        cb(null, this)
      })
      .catch(error => cb(error))

    return this
  }

  async startAsync(options = {}) {
    if (this.status === STARTING) {
      await this.activationEventWasFired(options)
      return this
    } else if (this.status === READY) {
      return this
    } else if (this.status === CREATED) {
      this.fireHook(WILL_START, options)
      this.status = STARTING

      try {
        await this.findNodeModules(options)
        this.status = READY
        return this
      } catch (error) {
        this.fireHook(DID_FAIL, error)
        this.status = FAILED
        this.state.set('error', error)
        this.runtime.error(`Error starting module manager: ${error.message}`)
        return this
      }
    } else {
      return this
    }
  }

  activationEventWasFired(options = {}) {
    const f = this
    const { timeout = 30 * 1000 } = options

    const ok = resolve => () => resolve(f)
    const notOk = (reject, err) => f => reject(err)

    if (this.status === FAILED || this.status === READY) {
      return Promise.resolve(this)
    }

    return new Promise((resolve, reject) => {
      f.once(WAS_ACTIVATED, () => ok(resolve)())
      f.once(DID_FAIL, err => notOk(reject, err)())
    })
      .catch(error => f)
      .then(() => f)
  }

  async whenActivated(options = {}) {
    if (this.status === READY) {
      return this
    }

    if (this.status === CREATED) {
      this.status = STARTING
      await this.startAsync(options)
      this.status = READY
    } else if (this.status === STARTING) {
      await this.activationEventWasFired(options).catch(e => e)
    }

    return this
  }

  downloadTarball(spec, destination, options = {}) {
    return this.runtime.packageManager.downloadTarball(spec, destination, options)
  }

  async findNodeModules(options = {}) {
    const { join } = this.runtime.pathUtils
    const { maxDepth, stopAt } = options

    let testPaths = await this.walkUp({ filename: 'node_modules' })

    if (maxDepth) {
      testPaths = testPaths.slice(0, maxDepth)
    }

    if (stopAt) {
      testPaths.filter(
        path =>
          !(
            path === stopAt ||
            path === join(path, 'node_modules') ||
            path.length < stopAt ||
            path.length < join(path, 'node_modules').length
          )
      )
    }

    testPaths = testPaths.concat(testPaths.map(p => p.replace('node_modules', '')))

    this.state.set('testPaths', testPaths)

    const packages = await this.finder
      .find(
        {
          testPaths,
          moduleFolderName: options.folderName || 'node_modules',
          ...options,
          parse: true,
        },
        this.context
      )
      .catch(error => {
        this.runtime.error(`Error finding node modules under ${testPaths.join('\n')}`)
        this.runtime.error(error.message)
        throw error
      })

    packages.forEach(pkg => {
      this.updateNodeModule(pkg)
    })

    return packages
  }

  async checkRepo(name, version = 'latest') {
    let request = name

    if (typeof version === 'string') {
      request = [name, version].join('@')
    }

    try {
      return JSON.parse(this.runtime.proc.execSync(`npm view ${request} --json`).toString())
    } catch (error) {
      return false
    }
  }

  find(name, version) {
    const data = this.manifests.get(name)
    if (!data) {
      return
    }

    if (data) {
      return typeof version === 'string' && version in data ? data[version] : Object.values(data)
    }
  }

  findBy(fn) {
    return this.packageData.filter(fn || this.lodash.identity)
  }

  findLatestByName(name) {
    return this.findByName(name, { latest: true })
  }

  findByName(name, options = {}) {
    const { isEmpty } = this.lodash
    const allVersions = this.manifests.get(name)
    const { latest = false } = options

    if (isEmpty(allVersions)) {
      return
    }

    if (latest) {
      const latest = this.runtime.packageFinder.semver.sort(Object.keys(allVersions)).pop()
      return allVersions[latest]
    } else {
      return allVersions
    }
  }

  pickAllBy(fn, options = {}) {
    fn = typeof fn === 'function' ? fn : v => v

    return this.chain
      .get(options.latest ? 'latestPackages' : 'packageData', [])
      .map(pkg => this.lodash.pickBy(pkg, fn))
      .reject(v => this.lodash.isEmpty(v))
      .value()
  }

  pickAll(...attributes) {
    const { isEmpty, pick } = this.lodash
    const { packageData } = this

    return packageData
      .map(pkg => pick(pkg, attributes.filter(v => typeof v === 'string')))
      .filter(v => !isEmpty(v))
  }

  findDependentsOf(packageName) {
    return this.lodash.pickBy(this.dependenciesMap, v => v[packageName])
  }

  get extendedDependenciesMap() {
    const { flatten, pick, entries, keys } = this.lodash

    return this.chain
      .get('latestPackages')
      .keyBy('name')
      .mapValues((pkg, source) => {
        const deps = pick(
          pkg,
          'dependencies',
          'devDependencies',
          'optionalDependencies',
          'peerDependencies'
        )

        return flatten(
          entries(deps).map(([type, value]) =>
            keys(value).map(name => ({ source, target: name, type }))
          )
        )
      })
      .value()
  }

  get dependenciesMap() {
    const { at, defaults } = this.lodash

    return this.chain
      .get('latestPackages')
      .keyBy('name')
      .mapValues(v =>
        defaults(
          {},
          ...at(v, 'dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies')
        )
      )
      .value()
  }

  walkUp(options = {}) {
    const testPaths = this.findModulePaths({
      cwd: this.runtime.cwd,
      filename: 'package.json',
      ...options,
    })

    return options.sync
      ? this.runtime.fsx.existingSync(...testPaths)
      : Promise.resolve(this.runtime.fsx.existingAsync(...testPaths))
  }

  walkUpSync(options = {}) {
    const testPaths = this.findModulePaths({
      cwd: this.runtime.cwd,
      filename: 'package.json',
      ...options,
    })

    return this.runtime.fsx.existingSync(...testPaths)
  }

  findModulePaths(options = {}) {
    if (typeof options === 'string') {
      options = { cwd: options }
    }

    const cwd = options.cwd
    const filename = options.filename || options.file || options.filename || 'skypager.js'

    const parts = cwd.split('/').slice(1)

    parts[0] = `/${parts[0]}`

    const testPaths = []

    while (parts.length) {
      testPaths.push([...parts, filename].join('/'))
      parts.pop()
    }

    return testPaths
  }

  async exportGraph(options = {}) {
    const { flatten, values, pick } = this.lodash
    const { latestPackages, extendedDependenciesMap } = this
    const {
      fields = ['name', 'version', 'keywords', 'license', 'description', 'homepage', 'repository'],
    } = options

    const edges = flatten(values(extendedDependenciesMap))
    const nodes = latestPackages.map(p => pick(p, fields))

    return {
      nodes,
      edges,
    }
  }

  async findVersionsInYarnCache(name, cacheDir) {
    cacheDir =
      cacheDir ||
      this.runtime.proc
        .execSync(`yarn cache dir`)
        .toString()
        .trim()

    const { fsx } = this.runtime

    const cacheFolders = await fsx.readdirAsync(cacheDir)
    const searchName = name.replace(/\//g, '-')
    const searchFolders = cacheFolders.reduce((memo, name) => {
      if (name.indexOf(searchName) === -1) {
        return memo
      }

      const versionParts = name
        .replace(/^npm-/, '')
        .replace(`${searchName}-`, '')
        .split('-')

      versionParts.pop()

      const version = versionParts.join('-')

      return {
        ...memo,
        [version]: name,
      }
    }, {})

    const versions = this.runtime.packageFinder.semver.sort(Object.keys(searchFolders)).reverse()

    return versions
  }

  async findInYarnCache(name, version, cacheDir) {
    cacheDir =
      cacheDir ||
      this.runtime.proc
        .execSync(`yarn cache dir`)
        .toString()
        .trim()

    const { fsx } = this.runtime

    if (cacheDir.endsWith('v4')) {
      return findInYarnCacheV4.call(this, name, version, cacheDir)
    }

    let packageName = name
    const isScoped = name.startsWith('@')

    if (isScoped) {
      const parts = name.split('/')
      const scope = parts[0]
      packageName = parts[1]
      cacheDir = this.runtime.resolve(cacheDir, `npm-${scope}`)
    }

    const folders = await fsx.readdirAsync(cacheDir)

    const found = folders.find(folderName => {
      // eslint-disable-line
      const [hash, pkgVersion, ...rest] = folderName.split('-').reverse()

      if (version && pkgVersion !== version) {
        return false
      }

      const realName = isScoped
        ? rest.reverse().join('-')
        : rest
            .reverse()
            .slice(1)
            .join('-')

      return realName === packageName
    })

    return found && this.runtime.resolve(cacheDir, found)
  }
}

export const CREATED = 'CREATED'
export const STARTING = 'STARTING'
export const FAILED = 'FAILED'
export const READY = 'READY'

export const STATUSES = {
  CREATED,
  READY,
  FAILED,
  STARTING,
}

export const DID_FAIL = 'didFail'
export const WAS_ACTIVATED = 'wasActivated'
export const WILL_START = 'willStart'

export const LIFECYCLE_HOOKS = {
  DID_FAIL,
  WAS_ACTIVATED,
  WILL_START,
}

async function findInYarnCacheV4(name, version, cacheDir, returnBase = false) {
  cacheDir =
    cacheDir ||
    this.runtime.proc
      .execSync(`yarn cache dir`)
      .toString()
      .trim()

  const { fsx } = this.runtime

  const cacheFolders = await fsx.readdirAsync(cacheDir)

  let cacheFolder

  if (version && version.length && version !== 'latest') {
    const searchName = name.startsWith('@')
      ? [name.replace(/\//g, '-'), version].join('-')
      : [name, version].join('-')

    cacheFolder = cacheFolders.find(folder => folder.indexOf(searchName) > -1)
  } else if (version === 'latest' || !version) {
    const searchName = name.replace(/\//g, '-')
    const searchFolders = cacheFolders.reduce((memo, name) => {
      if (name.indexOf(searchName) === -1) {
        return memo
      }

      const versionParts = name
        .replace(/^npm-/, '')
        .replace(`${searchName}-`, '')
        .split('-')

      versionParts.pop()

      const version = versionParts.join('-')

      return {
        ...memo,
        [version]: name,
      }
    }, {})

    const versions = this.runtime.packageFinder.semver.sort(Object.keys(searchFolders)).reverse()

    const latest = versions[0]

    cacheFolder = searchFolders[latest]
  }

  if (cacheFolder) {
    return returnBase
      ? this.runtime.resolve(cacheDir, cacheFolder)
      : this.runtime.resolve(cacheDir, cacheFolder, 'node_modules', ...name.split('/'))
  }
}
