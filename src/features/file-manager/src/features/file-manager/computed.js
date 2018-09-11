/**
  This contains definitions of functions which are applied
  to the fileManager instance as mobx computed properties.
*/
export function attach(options = {}) {
  const fileManager = this
  const { runtime } = fileManager
  const { mapValues, omit } = runtime.lodash

  const actions = mapValues(omit(module.exports, "default", "attach"), (fn, name) => [
    "computed",
    fn.bind(fileManager)
  ])

  runtime.makeObservable(actions, fileManager)

  return fileManager
}

export function extensions() {
  const { runtime } = this
  return runtime.fileManager.chain.result("files.values", []).map("extension").uniq().value()
}

export function mimeTypes() {
  const { runtime } = this
  return runtime.fileManager.chain
    .result("files.values", [])
    .map(file => file.mime && file.mime.mimeType)
    .compact()
    .uniq()
    .value()
}

export function mimeTypesByDirectory() {
  const { runtime } = this
  return runtime.fileManager.chain
    .result("files.values", [])
    .groupBy(file => runtime.pathUtils.dirname(runtime.pathUtils.relative(runtime.cwd, file.path)))
    .mapValues(list => list.map(f => f.mime.mimeType))
    .value()
}

export function extensionsByDirectory() {
  const { runtime } = this
  return runtime.fileManager.chain
    .result("files.values", [])
    .groupBy(file => runtime.pathUtils.dirname(runtime.pathUtils.relative(runtime.cwd, file.path)))
    .mapValues(list => runtime.lodash.uniq(list.map(f => f.extension)))
    .value()
}

export function mimeTypesByPackage() {
  const { runtime } = this
  const directories = runtime.fileManager.directories.keys()
  return directories.filter(dir => runtime.fileManager.files.has(`${dir}/package.json`))

  return runtime.fileManager.chain
    .result("files.values", [])
    .groupBy(file => runtime.pathUtils.dirname(runtime.pathUtils.relative(runtime.cwd, file.path)))
    .mapValues(list => runtime.lodash.uniq(list.map(f => f.mime.mimeType)))
    .pickBy((list, dir) => directories.indexOf(dir) >= 0)
    .value()
}

export function extensionsByPackage() {
  const { runtime } = this
  const directories = runtime.fileManager.directories.keys()
  return directories.filter(dir => runtime.fileManager.files.has(`${dir}/package.json`))

  return runtime.fileManager.chain
    .result("files.values", [])
    .groupBy(file => runtime.pathUtils.dirname(runtime.pathUtils.relative(runtime.cwd, file.path)))
    .mapValues(list => runtime.lodash.uniq(list.map(f => f.extension)))
    .pickBy((list, dir) => directories.indexOf(dir) >= 0)
    .value()
}

export function packageDirectories() {
  const { runtime } = this
  const directories = runtime.fileManager.directories.keys()
  return directories.filter(dir => runtime.fileManager.file(`${dir}/package.json`))
}

export function packagesByName() {
  const { runtime } = this
  return runtime.fileManager.packages
    .values()
    .reduce((memo, pkg) => ({ ...memo, [pkg.name]: pkg }), {})
}

export function packageVersionMap() {
  const { runtime } = this
  return runtime.chain
    .result("fileManager.packages.values", [])
    .keyBy("name")
    .mapValues("version")
    .value()
}

export function cacheBase() {
  const { runtime } = this
  const times = runtime.fileManager.files.values().map(v => v.mtime)
  return `${runtime.lodash.max(times)}:${times.length}`
}

export function cacheBaseByPackage() {
  const { runtime } = this
  const times = runtime.chain
    .invoke("fileManager.files.values")
    .groupBy(file =>
      runtime.pathUtils.relative(
        runtime.fileManager.baseFolder,
        runtime.pathUtils.dirname(file.path)
      )
    )
    .pickBy(
      (files, dir) => files.length > 0 && runtime.fileManager.files.has(`${dir}/package.json`)
    )
    .mapValues((files, dir) => {
      const maxUpdated = runtime.lodash.max(files.map(f => f.mtime))
      const count = files.length
      return `${maxUpdated || 0}:${count}`
    })
    .value()

  return times
}

export function packageLocations() {
  const { runtime } = this
  return runtime.chain
    .invoke("fileManager.files.entries")
    .filter(entry => entry[0].endsWith("package.json"))
    .map(e => e[0].replace(/\/package.json$/, ""))
    .uniq()
    .value()
}

export function cacheBaseByDirectory() {
  const { runtime } = this
  const times = runtime.chain
    .invoke("fileManager.files.values")
    .groupBy(file =>
      runtime.pathUtils.relative(
        runtime.fileManager.baseFolder,
        runtime.pathUtils.dirname(file.path)
      )
    )
    .mapValues((files, dir) => {
      const maxUpdated = runtime.lodash.max(files.map(f => f.mtime))
      const count = files.length
      return `${maxUpdated || 0}:${count}`
    })
    .value()

  return times
}
