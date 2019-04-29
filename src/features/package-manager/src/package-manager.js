import { Feature } from '@skypager/node'
import pacote from 'pacote'
import { tmpdir } from 'os'
import { extract as extractTar } from 'tar'

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

  initialState = {
    authenticated: false,
    ...(process.env.NPM_TOKEN && { npmToken: process.env.NPM_TOKEN }),
  }

  get runtime() {
    return super.runtime
  }

  get options() {
    return super.options
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
        function checkRemoteStatus(options = {}) {
          const p = this

          return p.runtime
            .select('package/repository-status', options)
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
   * @returns {Promise<PackageManager>}
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
   * @returns {Promise<PackageManager>}
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
   * @returns {Promise<PackageManager>}
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
   * @returns {Promise<PackageManager>}
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

  /**
   * Returns the packages where the version in the local tree isn't published to npm
   *
   * @readonly
   * @memberof PackageManager
   */
  get packagesAhead() {
    const {
      lodash: { pickBy },
      finder: { semver },
      versionMap,
      latestMap,
    } = this

    return pickBy(versionMap, (v, k) => semver.gt(v, latestMap[k]))
  }

  /**
   * Returns the packages who have a version number that doesn't exist in the npm registry
   *
   * @readonly
   * @memberof PackageManager
   */
  get unpublished() {
    const {
      lodash: { pickBy },
      versionMap,
    } = this

    return pickBy(versionMap, (v, k) => {
      const remote = this.remotes.get(k)
      return remote && remote.versions.indexOf(v) === -1
    })
  }

  /**
   * Returns the packages in the local tree whose versions are behind what is on npm.
   *
   * @readonly
   * @memberof PackageManager
   */
  get packagesBehind() {
    const {
      lodash: { pickBy },
      finder: { semver },
      versionMap,
      latestMap,
    } = this

    return pickBy(versionMap, (v, k) => semver.lt(v, latestMap[k]))
  }

  get outdated() {
    return this.packagesBehind
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

  get cache() {
    return this.fileManager.createCache({
      skypagerCachePath: this.findPackageCachePath(),
    })
  }

  isPackageCacheEnabled() {
    const { options } = this

    const isDisabled = !!(
      String(this.tryGet('disablePackageCache')) === 'true' ||
      String(this.tryGet('enablePackageCache')) === 'false' ||
      process.env.DISABLE_PACKAGE_CACHE ||
      options.noPackageCache ||
      options.disablePackageCache ||
      String(options.packageCache) === 'false'
    )

    return !isDisabled
  }

  findPackageCachePath() {
    const { options } = this
    const { runtime } = this
    const { isEmpty } = this.lodash

    const packageCachePath = this.tryGet('packageCachePath', options.packageCachePath)

    if (packageCachePath && packageCachePath.length) {
      return runtime.resolve(packageCachePath)
    }

    if (process.env.SKYPAGER_PACKAGE_CACHE_ROOT) {
      return runtime.resolve(process.env.SKYPAGER_PACKAGE_CACHE_ROOT)
    } else if (process.env.PORTFOLIO_CACHE_ROOT) {
      return runtime.resolve(process.env.PORTFOLIO_CACHE_ROOT, 'skypager-package-manager')
    } else if (!isEmpty(runtime.gitInfo.root)) {
      return runtime.resolve(
        runtime.gitInfo.root,
        'node_modules',
        '.cache',
        'skypager-package-manager'
      )
    }

    return runtime.resolve('node_modules', '.cache', 'skypager-package-manager')
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

  get pacote() {
    const { extract, packument, manifest, tarball } = pacote
    const { npmToken = this.options.npmToken } = this.currentState

    const enablePackageCache = this.isPackageCacheEnabled()
    const packageCachePath = this.findPackageCachePath()

    const twoArgs = fn => (spec, options = {}) =>
      fn(spec, {
        ...(npmToken && { token: npmToken }),
        ...(enablePackageCache && { cache: packageCachePath }),
        ...options,
      })

    const threeArgs = fn => (spec, dest, options = {}) =>
      fn(spec, dest, {
        ...(npmToken && { token: npmToken }),
        ...(enablePackageCache && { cache: packageCachePath }),
        ...options,
      })

    return {
      ...pacote,
      extract: threeArgs(extract),
      manifest: twoArgs(manifest),
      packument: twoArgs(packument),
      tarball: {
        ...twoArgs(tarball),
        toFile: threeArgs(tarball.toFile),
        stream: twoArgs(tarball.stream),
      },
    }
  }

  async npmClient(options = {}) {
    if (this._npmClient && !options.fresh) {
      return this._npmClient
    }

    let npmToken = this.state.get('')

    await this.findAuthToken(options)

    const client = this.runtime.client('npm', {
      npmToken,
      ...options,
    })

    return (this._npmClient = client)
  }

  async findAuthToken(options = {}) {
    if (!options.fresh || !options.refresh) {
      if (this.options.npmToken) {
        return this.options.npmToken
      } else if (process.env.NPM_TOKEN) {
        return process.env.NPM_TOKEN
      } else if (this.state.has('npmToken')) {
        return this.state.get('npmToken')
      }
    }

    const { cwd = this.runtime.cwd } = options

    const npmrcPath = await this.runtime.fsx.findUpAsync('.npmrc', {
      cwd,
    })

    if (npmrcPath) {
      const contents = await this.runtime.fsx.readFileAsync(npmrcPath).then(buf => String(buf))
      const lines = contents.split('\n')
      const authTokenLine = lines.find(line => {
        if (line.match(options.registry || 'registry.npmjs.org') && line.match(':_authToken=')) {
          return true
        }
      })

      if (!authTokenLine) {
        return this.findAuthToken({ cwd: this.runtime.resolve(cwd, '..') })
      } else {
        const value = authTokenLine.split(':_authToken=')[1]

        if (value) {
          this.state.set('authenticated', true)
          this.state.set('npmToken', value)
        }

        return value
      }
    } else {
      this.state.set('authenticated', true)
      this.state.delete('npmToken')

      return undefined
    }
  }
  /**
   * Find node module packages using the PackageFnder
   *
   * @param {Object} [options={}] options for the packageFinder.find method
   * @returns {Promise<Array<PackageManifest>>}
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
   * Returns an index of all of the package names and their last modified timestamps
   *
   * @param {Object} options
   * @param {Boolean} [options.listFiles=false] include the files and their times
   */
  async showLastModified(options = {}) {
    const { listFiles = false } = options
    const { fileManager } = this
    const { sortBy } = this.lodash

    const getMtime = file => (file.stats ? Math.ceil(file.stats.mtime / 1000) : 0)

    return this.chain
      .get('packageData', [])
      .map(({ name, _file }) => {
        const files = fileManager.fileObjects.filter(
          ({ path }) => _file && _file.dir && path.startsWith(_file.dir)
        )

        return [name, files]
      })
      .fromPairs()
      .mapValues(files =>
        listFiles
          ? sortBy(files, getMtime)
              .reverse()
              .map(file => ({
                id: file.relative,
                lastModified: getMtime(file),
              }))
          : files.reduce((memo, file) => {
              const mtime = getMtime(file)
              return mtime > memo ? mtime : memo
            }, 0)
      )
      .value()
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
   * @returns {Promise<Array>}
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

  async sortPackages(options = {}) {
    if (!this.usesLerna) {
      throw new Error(`We rely on lerna currently for their topological sorting.`)
    }

    const sorted = await this.runtime
      .select('process/output', {
        cmd: `lerna ls --toposort --json`,
      })
      .then(lines => JSON.parse(lines.join('\n')))

    return sorted.map(s => s.name)
  }

  async loadManifests(options = {}) {
    const { defaults, compact, castArray, flatten } = this.lodash
    const { runtime, fileManager } = this
    const packageIds = await fileManager.matchPaths(/package.json$/)
    const absolute = packageIds.map(p => runtime.resolve(p))

    const include = compact(flatten([...absolute, ...castArray(options.include)]))

    await this.fileManager.readAllContent({
      hash: true,
      ...options,
      include: p => include.indexOf(p) >= 0,
    })

    this.failed = this.failed || []

    packageIds.forEach(id => {
      try {
        const _file = fileManager.files.get(id)
        const _packageId = id
        const data = JSON.parse(_file.content)
        this.manifests.set(
          id,
          this.normalizePackage(
            defaults(
              {},
              data,
              {
                _packageId,
                _file,
              },
              this.manifests.get(id)
            )
          )
        )
      } catch (error) {
        this.failed.push({ id, error })
      }
    })
  }

  async _loadManifests(options = {}) {
    const { defaults, compact, castArray, flatten } = this.lodash
    const { runtime, fileManager } = this
    const { manifestPath } = runtime
    const packageIds = await fileManager.matchPaths(/package.json$/)
    const absolute = packageIds.map(p => runtime.resolve(p))

    const include = compact(flatten([...absolute, ...castArray(options.include)]))

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
      } catch (error) {
        this.failed.push([id, error])
      }
    })

    return this
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
    const filename = options.filename || options.file || 'skypager.js'

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

  async downloadPackage(packageName, options = {}) {
    const pkg = this.findByName(packageName)

    if (!pkg) {
      throw new Error(`Package ${packageName} not found`)
    }

    const { name } = pkg
    const { runtime } = this
    const { resolve, dirname, relative, sep } = runtime.pathUtils
    const { mkdirpAsync: mkdir, copyAsync: copy } = runtime.fsx
    const { uniqBy, identity } = this.lodash

    let { destination } = options

    const {
      version = pkg.version,
      folders = [],
      filter = identity,
      stripPrefix = 'package',
      dryRun,
      extract = false,
      replace = false,
      verbose = false,
    } = options

    const defaultDestination = resolve(runtime.cwd, 'build', 'packages', name, version)
    const downloadDestination = extract
      ? resolve(tmpdir(), name, version)
      : destination || defaultDestination

    await mkdir(downloadDestination)

    const tarballPath = await this.downloadTarball(`${name}@${version}`, downloadDestination)

    if (!extract) {
      return {
        name,
        version,
        tarballPath,
        dirname: dirname(tarballPath),
      }
    }

    const filterPaths = path => {
      let pass = !!filter(path)

      const item = stripPrefix
        ? path
            .split(sep)
            .slice(1)
            .join(sep)
        : path

      if (pass && folders.length) {
        pass = !!folders.find(i => item.startsWith(i))
      }

      if (pass) {
        extracted.push(resolve(extractFolder, path))
      }

      return pass
    }

    if (replace && !destination) {
      destination = pkg._file.dir

      await extractTar({
        file: tarballPath,
        cwd: destination,
        filter: filterPaths,
      })

      return {
        name,
        version,
        tarballPath,
        dirname: dirname(tarballPath),
        destination,
      }
    }

    const extracted = []

    let extractFolder = dirname(tarballPath)

    await extractTar({
      file: tarballPath,
      cwd: extractFolder,
      filter: filterPaths,
    })

    const response = {}

    destination = destination ? resolve(runtime.cwd, destination) : defaultDestination

    const ops = extracted.map(sourceFile => {
      const destId = stripPrefix
        ? relative(extractFolder, sourceFile)
            .split(sep)
            .slice(1)
            .join(sep)
        : relative(extractFolder, sourceFile)

      const dest = resolve(destination, destId)
      const destDir = dirname(dest)
      return { destDir, destId, dest, sourceFile }
    })

    const destDirectories = uniqBy(ops, 'destDir').map(op => op.destDir)

    response.ops = ops
    response.destinationDirectories = destDirectories

    if (dryRun) {
      console.log(`# Source:`, extractFolder)
      console.log(`# Destination:`, destination)

      if (verbose) {
        response.destinationDirectories.map(dir => {
          console.log(`mkdir -p ${dir}`)
        })

        ops.map(({ sourceFile, dest }) => {
          console.log(
            `cp ${sourceFile.replace(extractFolder, '~')} ${dest.replace(destination, '$dest')}`
          )
        })
      }
    } else {
      // might just be able to tar extract directly on to the destination without making directories
      await Promise.all(response.destinationDirectories.map(dir => mkdir(dir)))
      await Promise.all(ops.map(({ sourceFile, dest }) => copy(sourceFile, dest)))
    }

    return {
      ...response,
      tarballPath,
      extracted,
      dirname: extractFolder,
      destination,
    }
  }

  async downloadTarball(spec, destination, options = {}) {
    const { mkdirpAsync: mkdir } = this.runtime.fsx

    if (!spec) {
      throw new Error('Please provide a valid package spec, e.g. @skypager/node@latest')
    }

    if (typeof destination === 'object') {
      options = destination
      destination = options.destination || options.dest
    }

    let [name, version] = spec.replace(/^@/, '').split('@')

    if (!destination) {
      if (!version || !version.length) {
        const manifest = await this.pacote.manifest(spec)
        version = manifest.version
      }
      destination = `build/packages/${name}/${version}/package.tgz`
    }

    const isDirectory = await this.runtime.fsx
      .statAsync(destination)
      .then(stat => stat.isDirectory())
      .catch(error => false)

    if (isDirectory) {
      const fileName = `package-${name.replace('/', '-')}-${version}.tgz`
      destination = this.runtime.resolve(destination, fileName)
    }

    destination = this.runtime.resolve(destination)

    await mkdir(this.runtime.pathUtils.dirname(destination))

    await this.pacote.tarball.toFile(spec, destination, options)

    return destination
  }

  async createTarball(packageName, options = {}) {
    const pkg = this.findByName(packageName)

    if (!pkg) {
      throw new Error(`Package ${packageName} not found`)
    }

    const dir = pkg._file.dir

    const tar = require('tar')

    const files = await this.listPackageContents(packageName, {
      relative: false,
      hash: false,
      stats: false,
    }).then(results => results.map(r => r.path))

    const { output = `${packageName.replace(/\//g, '-')}.tgz` } = options
    const file = this.runtime.resolve(output)
    const outputDir = this.runtime.pathUtils.dirname(file)

    await this.runtime.fsx.mkdirpAsync(outputDir)

    await tar.create(
      {
        gzip: true,
        portable: true,
        mtime: new Date('1985-10-26T08:15:00.000Z'),
        prefix: 'package/',
        file,
        cwd: dir,
        ...options,
      },
      files
    )

    return file
  }
  /**
   * Uses npm-packlist to tell us everything in a project that will be published to npm
   *
   * @param {String} packageName the name of the package
   * @param {Object} options
   * @param {Boolean} [options.relative=false] whether to return the relative path, returns absolute by default.
   */
  async listPackageContents(packageName, { relative = false, hash = false, stats = false } = {}) {
    const pkg = this.findByName(packageName)

    if (!pkg) {
      throw new Error(`Package ${packageName} not found`)
    }

    const dir = pkg._file.dir

    const { resolve: resolvePath } = this.runtime.pathUtils
    const files = await require('npm-packlist')({ path: dir })

    const response = files.map(rel => ({ path: relative ? rel : resolvePath(dir, rel) }))

    const hashFile = file =>
      new Promise((resolve, reject) => {
        require('md5-file')(resolvePath(resolvePath(dir, file.path)), (err, hash) =>
          err ? reject(err) : resolve((file.hash = hash))
        )
      })

    const fileSize = file =>
      this.runtime.fsx
        .statAsync(resolvePath(dir, file.path))
        .then(stats => (file.size = stats.size))

    if (hash && stats) {
      await Promise.all(response.map(file => Promise.all([hashFile(file), fileSize(file)])))
    } else if (hash) {
      await Promise.all(response.map(file => hashFile(file)))
    } else if (stats) {
      await Promise.all(response.map(file => fileSize(file)))
    }

    return response
  }
  /**
   * Uses npm-packlist to build the list of files that will be published to npm,
   * calculates an md5 hash of the contents of each of the files listed, and then
   * sorts them by the filename.  Creates a hash of that unique set of objects, to
   * come up with a unique hash for the package source that is being released.
   *
   * @param {String} packageName
   * @param {Object} options
   * @param {Boolean} [options.compress=true] compress all the hashes into a single hash string value, setting to false will show the individual hashes of every file
   * @returns {String|Object}
   * @memberof PackageManager
   */
  async calculatePackageHash(packageName, { compress = true } = {}) {
    const pkg = this.findByName(packageName)

    if (!pkg) {
      throw new Error(`Package ${packageName} not found`)
    }

    const { resolve: resolvePath } = this.runtime.pathUtils
    const { dir } = pkg._file

    const hash = file =>
      new Promise((resolve, reject) => {
        file = resolvePath(dir, file)
        require('md5-file')(file, (err, hash) => (err ? reject(err) : resolve(hash)))
      })

    const files = await require('npm-packlist')({ path: dir })

    const { hashObject } = this.runtime
    const { sortBy } = this.lodash

    const hashes = await Promise.all(files.map(file => hash(file).then(hash => [file, hash])))

    return compress ? hashObject(sortBy(hashes, entry => entry[0])) : hashes
  }

  async packageProject(packageName, options = {}) {
    await tar.create(
      {
        cwd: dir,
        prefix: 'package/',
        portable: true,
        // Provide a specific date in the 1980s for the benefit of zip,
        // which is confounded by files dated at the Unix epoch 0.
        mtime: new Date('1985-10-26T08:15:00.000Z'),
        gzip: true,
      },
      // NOTE: node-tar does some Magic Stuff depending on prefixes for files
      //       specifically with @ signs, so we just neutralize that one
      //       and any such future "features" by prepending `./`
      files.map(f => `./${f}`)
    )
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
