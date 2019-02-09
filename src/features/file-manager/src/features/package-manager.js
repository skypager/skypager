import { Feature } from '@skypager/runtime'

/**
 * @class PackageManager
 * @classdesc The PackageManager is a database that contains all of the package.json files found in the repository
 */

export default class PackageManager extends Feature {
  static shortcut = 'packageManager'

  async featureWasEnabled() {
    this.status = CREATED

    if (this.runtime.argv.packageManager) {
      await this.startAsync()
    }
  }

  observables() {
    const p = this

    return {
      status: CREATED,

      manifests: ['shallowMap', {}],

      nodeModules: ['shallowMap', {}],

      remotes: ['shallowMap', []],

      updateNodeModule: [
        'action',
        function updateNodeModule(pkg) {
          p.nodeModules.set(pkg.name, {
            ...(p.nodeModules.get(pkg.name) || {}),
            [pkg.version]: pkg,
          })

          return this
        },
      ],

      updateRemote: [
        'action',
        function updateRemote(name, data, replace = false) {
          if (replace) {
            p.remotes.set(name, this.normalizePackage(data))
          } else {
            p.remotes.set(name, {
              ...(this.remotes.get(name) || {}),
              ...data,
            })
          }
        },
      ],

      checkRemoteStatus: [
        'action',
        function checkRemoteStatus() {
          const p = this

          return p.runtime
            .select('package/repository-status')
            .then(data => {
              Object.keys(data).forEach(pkg => p.updateRemote(pkg, data[pkg], true))
              return data
            })
            .catch(error => {
              this.error = error
            })
        },
      ],
    }
  }

  /**
   * Starts the PackageManager service, which scans the local project for any package.json manifests
   * and populates our manifests observable with the information
   *
   * @param {Object} [options={}]
   * @param {Boolean} [options.remote=false] whether to fetch the remote information about this package from npm
   * @returns {PromiseLike<PackageManager>}
   * @memberof PackageManager
   */
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
        if (this.fileManager.status === 'CREATED') {
          await this.fileManager.startAsync()
        } else {
          await this.fileManager.whenActivated()
        }

        await this.loadManifests()
        if (options.remote) {
          await this.checkRemoteStatus()
        }

        this.status = READY
        return this
      } catch (error) {
        this.fireHook(DID_FAIL, error)
        this.lastError = error
        this.status = FAILED
        return this
      }
    }
  }

  /**
   * Starts the package manager with the callback style
   *
   * @param {Object} [options={}]
   * @param {Boolean} [options.remote=false] whether to load remote repository information from npm
   * @param {Function} cb
   * @returns {PromiseLike<PackageManager>}
   * @memberof PackageManager
   */
  start(options = {}, cb) {
    if (typeof cb !== 'function') {
      return this.startAsync(options)
    }

    this.startAsync(options)
      .then(() => cb(null, this))
      .catch(cb)

    return this
  }

  /**
   * Returns a promise which resolves when the package manager is finally activated.
   *
   * @param {Object} [options={}]
   * @param {Number} [options.timeout=30000]
   * @returns {PromiseLike<PackageManager>}
   * @memberof PackageManager
   */
  async activationEventWasFired(options = {}) {
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
      .catch(error => error)
      .then(() => f)
  }

  /**
   * Returns a promise which will resolve when the package manager is finally activated.  If it hasn't yet
   * been started, this will start it.
   *
   * @param {Object} [options={}]
   * @returns {PromiseLike<PackageManager>}
   * @memberof PackageManager
   */
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

  /**
   * Info about all the possible statuses the package manager can be in
   *
   * @readonly
   * @memberof PackageManager
   */
  get statuses() {
    return STATUSES
  }

  /**
   * Information about the life cycle hooks emitted by the package manager
   *
   * @readonly
   * @memberof PackageManager
   */
  get lifecycleHooks() {
    return LIFECYCLE_HOOKS
  }

  /**
   * A reference to the FileManager feature
   * @type {FileManager}
   * @memberof PackageManager
   * @readonly
   */
  get fileManager() {
    return this.runtime.fileManager
  }

  /**
   * A reference to the PackageFinder feature
   *
   * @type {PackageFinder}
   * @readonly
   * @memberof PackageManager
   */
  get finder() {
    return this.runtime.packageFinder
  }

  /**
   * Returns the ids of all the packages found.  The id is the relative path to the package.json
   *
   * @property {Array<PackageId>}
   * @readonly
   * @memberof PackageManager
   */
  get packageIds() {
    return Array.from(this.manifests.keys())
  }

  /**
   * Returns all of the package manifests found.
   *
   * @type {Array<PackageManifest>}
   * @readonly
   * @memberof PackageManager
   */
  get packageData() {
    return Array.from(this.manifests.values()).map(v => this.runtime.convertToJS(v))
  }

  /**
   * Returns all of the package manifests found.
   *
   * @type {Array<PackageManifest>}
   * @readonly
   * @memberof PackageManager
   */
  get remoteData() {
    return Array.from(this.remotes.values()).map(v => this.runtime.convertToJS(v))
  }

  /**
   * Returns the names found in each manifest
   *
   * @type {Array<String>}
   * @readonly
   * @memberof PackageManager
   */
  get packageNames() {
    return this.packageData.map(p => p.name)
  }

  /**
   * Returns each manifest as entries
   *
   * @type {Array<Array>}
   * @readonly
   * @memberof PackageManager
   */
  get entries() {
    return this.manifests.entries().map(v => [v[0], this.runtime.convertToJS(v[1])])
  }

  /**
   * Returns each remote manifest as entries
   *
   * @type {Array<Array>}
   * @readonly
   * @memberof PackageManager
   */
  get remoteEntries() {
    return this.remotes.entries().map(v => [v[0], this.runtime.convertToJS(v[1])])
  }

  /**
   * Returns an object of every package manifest keyed by name
   *
   * @type {Object<String,PackageManifest>}
   * @readonly
   * @memberof PackageManager
   */
  get byName() {
    return this.chain
      .invoke('manifests.values', [])
      .keyBy(v => v.name)
      .mapValues(v => this.runtime.convertToJS(v))
      .value()
  }

  /**
   * Returns an object of every remote package manifest keyed by name
   *
   * @type {Object<String,PackageManifest>}
   * @readonly
   * @memberof PackageManager
   */
  get remotesByName() {
    return this.chain
      .invoke('remotes.values', [])
      .keyBy(v => v.name)
      .mapValues(v => this.runtime.convertToJS(v))
      .value()
  }

  get unpublished() {
    const { versionMap, latestMap } = this
    return this.lodash.pickBy(versionMap, (v, k) => !latestMap[k])
  }

  get outdated() {
    const { versionMap, latestMap } = this
    return this.lodash.pickBy(versionMap, (v, k) => v !== latestMap[k])
  }

  get latestMap() {
    const p = this
    const get = p.runtime.lodash.get

    return p.chain
      .result('remotes.values', [])
      .keyBy(v => v.name)
      .mapValues((v, k) => {
        return get(v, ['dist-tags', 'latest'], v.version)
      })
      .pickBy(v => v && v.length)
      .value()
  }

  get tarballUrls() {
    const { remotes } = this
    return Array.from(remotes.values()).reduce((memo, remote) => {
      if (remote && remote.dist) {
        memo[remote.name] = remote.dist && remote.dist.tarball
      }
      return memo
    }, {})
  }

  get hasYarnPackageLock() {
    return this.runtime.fsx.existsSync(this.runtime.resolve('yarn.lock'))
  }

  get hasNpmPackageLock() {
    return this.runtime.fsx.existsSync(this.runtime.resolve('package-lock.json'))
  }

  get usesLerna() {
    return this.runtime.fsx.existsSync(this.runtime.resolve('lerna.json'))
  }

  get usesYarnWorkspaces() {
    return this.hasYarnPackageLock && this.yarnWorkspacePatterns.length
  }

  get lernaPackagePatterns() {
    return !this.usesLerna
      ? []
      : this.runtime.fsx.readJsonSync(this.runtime.resolve('lerna.json')).packages
  }

  get yarnWorkspacePatterns() {
    return this.runtime.get('currentPackage.workspaces', [])
  }

  /**
   * Returns a table of all of the packages, their current version, and remote version
   */
  get remoteVersionMap() {
    return this.chain
      .get('versionMap')
      .mapValues((local, name) => ({
        local,
        remote: this.get(['remotesByName', name, 'version'], local),
      }))
      .value()
  }

  get allVersionsByPackage() {
    return this.chain
      .get('remoteEntries')
      .fromPairs()
      .mapValues('versions')
      .value()
  }

  get versionMap() {
    const p = this
    return p.chain
      .result('manifests.values', [])
      .keyBy(v => v.name)
      .mapValues(v => v.version)
      .value()
  }

  /**
   * Finds a package by its id, or name
   *
   * @param {String} id the package id, or name
   * @returns {PackageManifest}
   */
  find(id) {
    const ids = this.manifests.keys()
    const match =
      ids.find(
        i =>
          i === id ||
          i === `${id}/package.json` ||
          i === `src/${id}` ||
          i === `src/${id}/package.json`
      ) || id

    const result =
      this.manifests.get(match) || this.manifests.values().find(v => v && v.name && v.name === id)

    if (!result) {
      return
    }

    const toJS = v => this.runtime.convertToJS(v)
    return toJS(this.lodash.mapValues(result, v => toJS(v)))
  }

  /**
   * Finds a package by a function
   *
   * @param {Function} iterator
   * @returns {PackageManifest}
   */
  findBy(fn) {
    return this.manifests.values().filter(fn || this.lodash.identity)
  }

  /**
   * Finds a package by its name
   *
   * @param {String} name
   */
  findByName(name) {
    return this.manifests.get(name) || this.manifests.values().find(m => m.name === name)
  }

  /**
   * Find all dependents of a given package
   *
   * @param {String} packageName
   * @returns {Object<String, PackageManifest>}
   */
  findDependentsOf(packageName) {
    return this.lodash.pickBy(this.dependenciesMap, v => v[packageName])
  }

  /**
   * For every package in the project, run the lodash pickBy function to get arbitrary attributes
   *
   * @param {Function} pickBy function which will get passed (value, key)
   * @returns {Array<Object>}
   */
  pickAllBy(fn) {
    fn = typeof fn === 'function' ? fn : v => v
    return this.packageData.map(pkg => this.lodash.pickBy(pkg, fn))
  }

  /**
   * For every package in the project, run the lodash pick function to get arbitrary attributes
   *
   * @param {...String} attributes list of attribute keys to pull from the package
   * @returns {Array<Object>}
   */
  pickAll(...attributes) {
    return this.packageData.map(p => this.lodash.pick(p, ...attributes))
  }

  /**
   * For every package in the project, run the lodash pickBy function to get arbitrary attributes
   *
   * @param {Function} pickBy function which will get passed (value, key)
   * @returns {Array<Object>}
   */
  pickAllRemotesBy(fn) {
    fn = typeof fn === 'function' ? fn : v => v
    return this.remoteData.map(pkg => this.lodash.pickBy(pkg, fn))
  }

  /**
   * For every package in the project, run the lodash pick function to get arbitrary attributes
   *
   * @param {...String} attributes list of attribute keys to pull from the package
   * @returns {Array<Object>}
   */
  pickAllRemotes(...attributes) {
    return this.remoteData.map(p => this.lodash.pick(p, ...attributes))
  }

  /**
   * Find node module packages using the PackageFnder
   *
   * @param {Object} [options={}] options for the packageFinder.find method
   * @returns {PromiseLike<Array<PackageManifest>>}
   * @memberof PackageManager
   */
  async findNodeModules(options = {}) {
    const testPaths = await this.walkUp({ filename: 'node_modules' })

    const packages = await this.finder.find(
      {
        testPaths: testPaths.concat(testPaths.map(p => p.replace('node_modules', ''))),
        moduleFolderName: options.folderName || 'node_modules',
        ...options,
        parse: true,
      },
      this.context
    )

    packages.forEach(pkg => {
      this.updateNodeModule(this.normalizePackage(pkg))
    })

    return packages
  }

  /**
   * Selects all of the files in the FileManager that live underneath a given package folder
   *
   * @param {*} [options={}]
   * @returns {Array<{ name: string, tree: array, manifest: PackageManifest }>}
   * @memberof PackageManager
   */
  async selectPackageTree(options = {}) {
    if (typeof options === 'string') {
      options = { name: options }
    }

    const { name } = options

    const pkg = this.find(name) || this.findByName(name)

    if (pkg && pkg._packageId) {
      return this.runtime
        .select('files/tree', {
          rootNode: pkg._packageId.replace('/package.json', ''),
          readContents: true,
          hashFiles: true,
          ...options,
        })
        .then(tree => ({ name: pkg.name, manifest: pkg, tree }))
    } else {
      return this.runtime
        .select('files/tree', {
          readContents: true,
          hashFiles: true,
          ...options,
        })
        .then(tree => ({
          name: this.runtime.get('currentPackage.name', this.runtime.cwd.split('/').pop()),
          manifest: this.runtime.currentPackage,
          tree,
        }))
    }
  }

  /**
   * Exports nodes and edges for use in a graph visualization
   *
   * @param {Object} [options={}]
   * @returns {PackageGraph}
   * @memberof PackageManager
   */
  async exportGraph(options = {}) {
    const packageManager = this
    const { currentPackage } = this.runtime
    const { result, keys, pickBy, entries, flatten } = this.lodash
    const { byName } = this

    const { defaultProjectType = 'library', scope, exclude = [], direction = 'both' } = options

    const packageScope =
      scope || options.packageScope || currentPackage.name.startsWith('@')
        ? currentPackage.name.split('/')[0]
        : currentPackage.name.split('-')

    function stripPackageScope(fromName) {
      return fromName.replace(`${packageScope}/`, '')
    }

    function isDevDependency(sourceName, targetName) {
      const pkg = byName[sourceName]
      return pkg.devDependencies && pkg.devDependencies[targetName]
    }

    // a package can declare its projectType as a package.json property
    // at the top level, or under the key whose name matches the package scope (e.g. @skypager looks in skypager)
    const findProjectType =
      typeof options.findProjectType === 'function'
        ? options.findProjectType
        : p =>
            result(p, 'projectType', () =>
              result(p, [packageScope.replace('@', ''), 'projectType'], defaultProjectType)
            )

    const packageDependents = this.chain
      .get('dependenciesMap')
      .mapValues(d =>
        keys(pickBy(d, (v, k) => k.startsWith(packageScope) && exclude.indexOf(k) === -1))
      )
      .pickBy(v => v.length)
      .value()

    const packagesDependedOn = this.chain
      .get('packageNames')
      .filter(name => exclude.indexOf(name) === -1 && name.startsWith(packageScope))
      .map(name => [name, keys(packageManager.findDependentsOf(name))])
      .sortBy(v => v[1].length)
      .reject(v => !v[1].length)
      .fromPairs()
      .value()

    const nodes = this.packageData
      .filter(
        ({ name }) =>
          exclude.indexOf(name) === -1 && (packagesDependedOn[name] || packageDependents[name])
      )
      .map((p, index) => {
        const { name } = p
        const projectType = findProjectType(p)

        return {
          data: { id: stripPackageScope(name), label: stripPackageScope(name) },
          classes: [projectType],
        }
      })
      .filter(Boolean)

    const dependsLinks = flatten(
      entries(packagesDependedOn)
        .filter(([targetName]) => exclude.indexOf(targetName) === -1)
        .map(([targetName, list]) =>
          list
            .filter(sourceName => exclude.indexOf(sourceName) === -1)
            .map((sourceName, i) => ({
              data: {
                source: stripPackageScope(sourceName),
                target: stripPackageScope(targetName),
              },
              classes: [
                'depends',
                isDevDependency(sourceName, targetName) ? 'devDependency' : 'prodDependency',
              ],
            }))
        )
    )

    const needsLinks = flatten(
      entries(packageDependents)
        .filter(([sourceName]) => exclude.indexOf(sourceName) === -1)
        .map(([sourceName, list]) =>
          list
            .filter(targetName => exclude.indexOf(targetName) === -1)
            .map((targetName, i) => {
              return {
                data: {
                  source: stripPackageScope(sourceName),
                  target: stripPackageScope(targetName),
                },
                classes: [
                  'needs',
                  isDevDependency(sourceName, targetName) ? 'devDependency' : 'prodDependency',
                ],
              }
            })
        )
    )

    let edges

    // graph the packages by what they depend on
    if (direction === 'depends') {
      edges = dependsLinks
      // graph the packages by what is depended on
    } else if (direction === 'needs') {
      edges = needsLinks
    } else if (direction === 'both') {
      // show both types of relationships
      edges = needsLinks.concat(dependsLinks)
    }

    // this is the shape required by the cytograph-dagre library
    return {
      graph: {
        nodes,
        edges,
      },
      packagesDependedOn,
      packageDependents,
      packages: this.packageData,
      exclude,
      packageScope,
      direction,
    }
  }

  /**
   * Returns all of the packages who have modifications in their tree
   *
   * @param {Object} [options={}]
   * @returns {PromiseLike<Array>}
   * @memberof PackageManager
   */
  async selectModifiedPackages(options = {}) {
    const packageIds = await this.runtime.select('package/changed', options)
    return packageIds.map(id => this.manifests.get(id)).filter(f => f)
  }

  /**
   * Creates a JSON snapshot of all of the package manifests,
   * along with additional metadata
   *
   * @param {*} [options={}]
   * @returns {PackageManagerSnapshot}
   * @memberof PackageManager
   */
  async createSnapshot(options = {}) {
    const { mapValues } = this.lodash
    const m = this.manifests.toJSON()
    const r = this.remotes.toJSON()
    const manifests = mapValues(m, v => this.runtime.convertToJS(v))
    const remotes = mapValues(r, v => this.runtime.convertToJS(v))

    return {
      manifests,
      remotes,
      gitInfo: this.runtime.gitInfo,
      cwd: this.runtime.cwd,
      versionMap: this.versionMap,
      latestMap: this.latestMap,
    }
  }

  /**
   * Gets a map of packages and their dependents
   *
   * @readonly
   * @memberof PackageManager
   */
  get dependenciesMap() {
    const { at, defaults } = this.lodash

    return this.chain
      .invoke('manifests.values')
      .keyBy('name')
      .mapValues(v =>
        defaults(
          {},
          ...at(v, 'dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies')
        )
      )
      .value()
  }

  async loadManifests(options = {}) {
    const packageIds = await this.fileManager.matchPaths(/package.json$/)
    const absolute = packageIds.map(p => this.runtime.resolve(p))
    const { defaults, compact, castArray, flatten } = this.lodash

    const include = compact(flatten([...absolute, ...castArray(options.include || [])]))

    const results = await this.fileManager.readAllContent({
      hash: true,
      ...options,
      include: p => include.indexOf(p) >= 0,
    })

    this.failed = this.failed || []

    try {
      this.manifests.set(this.runtime.relative(this.runtime.manifestPath), {
        ...this.runtime.currentPackage,
        _packageId: 'package.json',
        _file: this.fileManager.files.get('package.json'),
      })
    } catch (error) {}

    results.forEach(entry => {
      const [id, content] = entry

      try {
        const data = JSON.parse(content || '{}')
        this.manifests.set(
          id,
          this.normalizePackage(
            defaults(
              {},
              data,
              {
                _packageId: id,
                _file: this.fileManager.file(id),
              },
              this.manifests.get(id)
            )
          )
        )
      } catch (error) {
        this.failed.push([id, error])
      }
    })

    return this
  }

  walkUp(options = {}) {
    const testPaths = findModulePaths({
      cwd: this.runtime.cwd,
      filename: 'package.json',
      ...options,
    })

    return options.sync
      ? this.runtime.fsx.existingSync(...testPaths)
      : Promise.resolve(this.runtime.fsx.existingAsync(...testPaths))
  }

  walkUpSync(options = {}) {
    const testPaths = findModulePaths({
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

  normalizePackage(manifest = {}) {
    const { defaults } = this.lodash

    return defaults(manifest, {
      keywords: [],
      description: '',
      author: '',
      contributors: [],
      scripts: {},
    })
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

/**
 * @typedef {Object} PackageManifest
 * @property {String} name
 * @property {String} version
 * @property {String} license
 * @property {String} description
 * @property {Object} dependencies
 * @property {Object} devDependencies
 * @property {String} homepage
 *
 */

/**
 * @typedef {String} PackageId
 */

/**
 * @typedef {Object} PackageManagerSnapshot
 * @property {Array<PackageManifest>} manifests
 * @property {Array<PackageManifest>} remotes
 * @property {Object} gitInfo
 * @property {String} cwd
 */
/**
 * @typedef {Object} PackageGraph
 * @property {Object} graph
 * @property {Array<PackageManifest>} graph.nodes
 * @property {Array<{ source: string, target: string, type: string }>} graph.edges
 * @property {Object} packagesDependedOn
 * @property {Object} packageDependents
 */
