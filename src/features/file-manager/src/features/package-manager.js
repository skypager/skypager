import Promise from 'bluebird'

export const featureMethods = [
  'normalizePackage',
  'getVersionMap',
  'getLatestMap',
  'getTarballUrls',
  'loadManifests',
  'getFinder',
  'getFileManager',
  'find',
  'findBy',
  'findByName',
  'startAsync',
  'getOutdated',
  'createSnapshot',
  'getDependenciesMap',
  'findDependentsOf',
  'selectPackageTree',
  'getPackageIds',
  'getPackageNames',
  'getPackageData',
  'getEntries',
  'getByName',
  'pickAllBy',
  'pickAll',
  'selectModifiedPackages',
  'getLifeCycleHooks',
  'getStatuses',
  'whenActivated',
  'activationEventWasFired',
  'findNodeModules',
  'walkUp',
  'walkUpSync',
  'exportGraph',
]

export const createGetter = 'packageManager'

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

export const getStatuses = () => STATUSES
export const getLifeCycleHooks = () => LIFECYCLE_HOOKS

export function getFinder() {
  return this.runtime.packageFinder
}

export async function findNodeModules(options = {}) {
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

export function activationEventWasFired(options = {}) {
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
    .timeout(timeout)
    .catch(error => f)
    .then(() => f)
}

/**
  Returns a Promise which will resolve if, or when the file manager is activated
*/
export async function whenActivated(options = {}) {
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

export function getPackageIds() {
  return this.manifests.keys()
}

export function getPackageData() {
  return Object.values(this.manifests.toJSON()).map(v => this.runtime.convertToJS(v))
}

export function getPackageNames() {
  return this.packageData.map(p => p.name)
}

export function getEntries() {
  return this.manifests.entries().map(v => [v[0], this.runtime.convertToJS(v[1])])
}

export function getByName() {
  return this.chain
    .invoke('manifests.values', [])
    .keyBy(v => v.name)
    .mapValues(v => this.runtime.convertToJS(v))
    .value()
}

export function featureWasEnabled() {
  this.status = CREATED

  if (this.runtime.argv.packageManager) {
    Promise.resolve(this.startAsync())
  }
}

export async function selectPackageTree(options = {}) {
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

export function start(options = {}, cb = function() {}) {
  this.startAsync(options)
    .then(() => {
      cb && cb.call(this, null, this)
    })
    .catch(e => {
      cb && cb.call(this, e)
    })

  return this
}

export async function exportGraph(options = {}) {
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

export async function startAsync(options = {}) {
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

export function getUnpublished() {
  const { versionMap, latestMap } = this
  return this.lodash.pickBy(versionMap, (v, k) => !latestMap[k])
}

export function getOutdated() {
  const { versionMap, latestMap } = this
  return this.lodash.pickBy(versionMap, (v, k) => v !== latestMap[k])
}

export function getLatestMap() {
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

export function getTarballUrls() {
  const p = this
  return p.chain
    .result('remotes.values', [])
    .keyBy(v => v.name)
    .mapValues(v => v.dist && v.dist.tarball)
    .compact()
    .value()
}

export function getVersionMap() {
  const p = this
  return p.chain
    .result('manifests.values', [])
    .keyBy(v => v.name)
    .mapValues(v => v.version)
    .value()
}

export function observables() {
  const p = this

  return {
    status: CREATED,

    manifests: ['shallowMap', {}],

    nodeModules: ['shallowMap', {}],

    remotes: ['shallowMap', []],

    updateNodeModule: [
      'action',
      function(pkg) {
        p.nodeModules.set(pkg.name, {
          ...(p.nodeModules.get(pkg.name) || {}),
          [pkg.version]: pkg,
        })

        return this
      },
    ],

    updateRemote: [
      'action',
      function(name, data) {
        p.remotes.set(name, this.normalizePackage(data))
      },
    ],

    manifestData: [
      'computed',
      function() {
        return this.chain
          .result('manifests.toJSON', {})
          .mapValues(v => this.runtime.convertToJS(v))
          .value()
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
      function() {
        const p = this

        return p.runtime
          .select('package/repository-status')
          .then(data => {
            Object.keys(data).forEach(pkg => p.updateRemote(pkg, data[pkg]))
            return data
          })
          .catch(error => {
            this.error = error
          })
      },
    ],
  }
}

export function find(id) {
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

export function findBy(fn) {
  return this.manifests.values().filter(fn || this.lodash.identity)
}

export function findByName(name) {
  return this.manifests.get(name) || this.manifests.values().find(m => m.name === name)
}

export function getFileManager() {
  return this.runtime.fileManager
}

export function pickAllBy(fn) {
  fn = typeof fn === 'function' ? fn : v => v
  return this.packageData.map(pkg => this.lodash.pickBy(pkg, fn))
}

export function pickAll(...attributes) {
  return this.packageData.map(p => this.lodash.pick(p, ...attributes))
}

export async function selectModifiedPackages(options = {}) {
  const packageIds = await this.runtime.select('package/changed', options)
  return packageIds.map(id => this.manifests.get(id)).filter(f => f)
}

export async function createSnapshot(options = {}) {
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

export function findDependentsOf(packageName) {
  return this.lodash.pickBy(this.dependenciesMap, v => v[packageName])
}

export function getDependenciesMap() {
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

export async function loadManifests(options = {}) {
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

export function walkUp(options = {}) {
  const testPaths = findModulePaths({
    cwd: this.runtime.cwd,
    filename: 'package.json',
    ...options,
  })

  return options.sync
    ? this.runtime.fsx.existingSync(...testPaths)
    : Promise.resolve(this.runtime.fsx.existingAsync(...testPaths))
}

export function walkUpSync(options = {}) {
  const testPaths = findModulePaths({
    cwd: this.runtime.cwd,
    filename: 'package.json',
    ...options,
  })

  return this.runtime.fsx.existingSync(...testPaths)
}

function findModulePaths(options = {}) {
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

export function normalizePackage(manifest = {}) {
  const { defaults } = this.lodash

  return defaults(manifest, {
    keywords: [],
    description: '',
    author: '',
    contributors: [],
    scripts: {},
  })
}
