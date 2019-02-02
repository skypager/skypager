import { Feature } from '@skypager/runtime/lib/feature'

export default class PackageCacheFeature extends Feature {
  createGetter = 'packageCache'

  featureWasEnabled(o) {
    this.initializeFolder(o).then(() => {})
  }

  observables(options = {}, context = {}) {
    const packageCache = this

    return {
      snapshots: ['map', {}],
      updateSnapshot: [
        'action',
        function(name, data) {
          packageCache.snapshots.set(name, data)
          return packageCache
        },
      ],
    }
  }

  async snapshot(options = {}, ...args) {
    const snapshot = await this.buildSnapshot(options)
    const { write = true, name = this.runtime.currentPackage.name } = {
      ...this.options,
      ...options,
    }

    if (write) {
      await this.exportSnapshot({
        name,
        fileName: [name, this.runtime.gitInfo.abbreviatedSha].join('-'),
        ...options,
        snapshot,
      })
    }

    this.updateSnapshot(name, snapshot)

    return snapshot
  }

  async findAvailableSnapshots(options = {}, context = {}) {
    return this.runtime.fsx.readdirAsync(this.cachePath)
  }

  getCachePath(options = {}, context = {}) {
    const { runtime = this.runtime } = context
    const { name = runtime.currentPackage.name, baseFolder = 'node_modules' } = options

    return process.env.SKYPAGER_PACKAGE_CACHE_ROOT
      ? runtime.resolve(process.env.SKYPAGER_PACKAGE_CACHE_ROOT, name, 'snapshots')
      : runtime.resolve(baseFolder, '.cache', name, 'snapshots')
  }

  async initializeFolder(options = {}, context = {}) {
    const { runtime = this.runtime } = context
    const { mkdirpAsync: mkdirp } = runtime.fsx
    await mkdirp(this.cachePath)
  }

  async exportSnapshot(options = {}) {
    if (typeof options === 'string') {
      options = { fileName: options }
    }
    const { snapshot } = options
    const fileName = (options.fileName || this.runtime.currentPackage.name).replace(/\.json$/, '')
    const snapshotPath = this.runtime.resolve(this.cachePath, `${fileName}.json`)
    await this.runtime.fsx.writeFileAsync(snapshotPath, JSON.stringify(snapshot, null))

    return snapshot
  }

  async loadSnapshot(options = {}) {
    if (typeof options === 'string') {
      options = { fileName: options }
    }
    const fileName = (options.fileName || this.runtime.currentPackage.name).replace(/\.json$/, '')
    const snapshotPath = this.runtime.resolve(this.cachePath, `${fileName}.json`)
    const snapshot = await this.runtime.fsx.readJsonAsync(snapshotPath)

    this.updateSnapshot(fileName.replace('.json', ''), snapshot)

    return snapshot
  }

  async stats(options = {}) {
    if (typeof options === 'string') {
      options = { fileName: options }
    }
    const fileName = (options.fileName || this.runtime.currentPackage.name).replace(/\.json$/, '')
    const snapshotPath = this.runtime.resolve(this.cachePath, `${fileName}.json`)
    return this.runtime.fsx.snapshotAsync(snapshotPath)
  }

  async buildSnapshot(options = {}) {
    const { runtime } = this
    const { selectors = [], deep = true } = options

    const promiseMap = selectors.map(selectorId =>
      runtime
        .select(selectorId, options)
        .then(results => [selectorId, results])
        .catch(err => [selectorId, err])
    )

    const snapshot = await Promise.all(promiseMap)

    runtime.fireHook('snapshotWasCreated', {
      snapshot,
      options,
      selectors,
    })

    const keys = snapshot.map(s => s[0].replace(/\//g, '.'))
    const values = snapshot.map(s => s[1])

    return deep
      ? runtime.lodash.zipObjectDeep(keys, values)
      : runtime.lodash.zipObject(keys, values)
  }
}
