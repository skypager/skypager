import Promise from 'bluebird'

export function normalizePackage(manifest) {
  const { defaults } = this.lodash

  return defaults(manifest, {
    keywords: [],
    description: '',
    author: '',
    contributors: [],
    scripts: {},
  })
}

export const featureMethods = [
  'normalizePackage',
  'getFinder',
  'find',
  'findBy',
  'findByName',
  'findLatestByName',
  'findDependentsOf',
  'getPackageNames',
  'getPackageIds',
  'getPackageData',
  'getEntries',
  'getByName',
  'pickAllBy',
  'pickAll',
  'findNodeModules',
  'walkUp',
  'walkUpSync',
  'getLifeCycleHooks',
  'getStatuses',
  'whenActivated',
  'activationEventWasFired',
  'start',
  'startAsync',
  'getLatestPackages',
  'getDependenciesMap',
  'getExtendedDependenciesMap',
  'exportGraph',
  'downloadTarball',
  'findInYarnCache',
]

export const createGetter = 'moduleManager'

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

export const featureMixinOptions = {
  partial: [],
  insertOptions: false,
}

export async function downloadTarball(packageName, version, destination) {
  const info = await checkRepo.call(this, packageName, version)

  if (info && info.dist && info.dist.tarball) {
    const filename = destination
      ? this.runtime.resolve(destination)
      : this.runtime.resolve(info.dist.tarball.split('/').pop())

    await this.runtime.fileDownloader.downloadAsync(info.dist.tarball, filename)

    return filename
  }
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

export async function findNodeModules(options = {}) {
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

export function getPackageIds() {
  return this.manifests.keys()
}

export function getLatestPackages() {
  return this.packageIds.map(id => this.findLatestByName(id))
}

export function getPackageData() {
  return this.chain
    .result('manifests.values', [])
    .values()
    .map(v => Object.values(v))
    .flatten()
    .uniqBy(v => `${v.name}.${v.version}`)
    .value()
}

export function getPackageNames() {
  return this.packageIds
}

export function getEntries() {
  return this.manifests.entries().map(v => [v[0], this.runtime.convertToJS(v[1])])
}

export function getByName() {
  return this.chain
    .get('packageData')
    .keyBy(v => v.name)
    .value()
}

export function observables() {
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
        return checkRepo.call(p, name).then(result => {
          if (result && typeof result === 'object' && result.name && result.version) {
            p.updateRemote(name, result)
          }

          return result
        })
      },
    ],
  }
}

export function checkRepo(name, version) {
  let request = name

  if (typeof version === 'string') {
    request = [name, version].join('@')
  }

  return this.runtime.proc.async
    .exec(`npm info ${request} --json`)
    .then(c => c && c.stdout && c.stdout.toString())
    .then(json => json && json.length && JSON.parse(json))
    .catch(e => undefined)
}

export function find(name, version) {
  const data = this.manifests.get(name)
  if (!data) {
    return
  }

  if (data) {
    return typeof version === 'string' && version in data ? data[version] : Object.values(data)
  }
}

export function findBy(fn) {
  return this.packageData.filter(fn || this.lodash.identity)
}

export function findLatestByName(name) {
  return this.findByName(name, { latest: true })
}

export function findByName(name, options = {}) {
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

export function pickAllBy(fn, options = {}) {
  fn = typeof fn === 'function' ? fn : v => v

  return this.chain
    .get(options.latest ? 'latestPackages' : 'packageData', [])
    .map(pkg => this.lodash.pickBy(pkg, fn))
    .reject(v => this.lodash.isEmpty(v))
    .value()
}

export function pickAll(...attributes) {
  const { isEmpty, pick } = this.lodash
  const { packageData } = this

  return packageData
    .map(pkg => pick(pkg, attributes.filter(v => typeof v === 'string')))
    .filter(v => !isEmpty(v))
}

export function findDependentsOf(packageName) {
  return this.lodash.pickBy(this.dependenciesMap, v => v[packageName])
}

export function getExtendedDependenciesMap() {
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

export function getDependenciesMap() {
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

export function findModulePaths(options = {}) {
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

export async function exportGraph(options = {}) {
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

export async function findInYarnCache(name, version, cacheDir) {
  cacheDir =
    cacheDir ||
    this.runtime.proc
      .execSync(`yarn cache dir`)
      .toString()
      .trim()

  const { fsx } = this.runtime

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
