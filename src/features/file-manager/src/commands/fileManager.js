export function program(p) {
  return p
    .command("fileManager")
    .description("launch the file manager")
    .option("--base", "the base folder to start from")
    .option("--ignore <pattern>", "ignore a file pattern")
    .option("--doc-type <doctype>", "load the given docType handles")
}

export async function validate() {
  return true
}

export async function prepare() {
  const { runtime } = this
  const { fileManager } = runtime
  const { castArray } = runtime.lodash

  // prettier-ignore
  fileManager.configure(cfg => {
    return cfg
    .baseFolder(runtime.resolve(runtime.get("argv.base", "src")))
    .when(runtime.argv.ignore, c => {
      return castArray(runtime.argv.ignore)
        .map(p => runtime.resolve(p))
        .reduce((memo, ignorePath) => memo.ignore(ignorePath), c)
    })
  })
}

export async function run() {
  const { runtime } = this

  if (!runtime.has("packageManager")) runtime.feature("package-manager").enable()

  const { packageManager, fileManager } = runtime

  await fileManager.whenActivated()

  if (runtime.argv.updateCache) {
    runtime.debug("updating cache tables")

    const cacheTables = await runtime.select("cache-tables")
    await runtime.fsx.mkdirpAsync(runtime.join("node_modules", ".cache", runtime.currentPackage.name))

    await runtime.fsx.writeJsonAsync(
      runtime.join("node_modules", ".cache", runtime.currentPackage.name, "file-manager-cache-tables.json"),
      cacheTables,
    )

    runtime.debug("updated cache tables")
  }

  if (runtime.argv.checkRemotes) {
    await packageManager.checkRemoteStatus()
    await runtime.fsx.writeJsonAsync(
      runtime.join("node_modules", ".cache", runtime.currentPackage.name, "package-manager-remotes.json"),
      packageManager.remotes.toJS(),
    )

    runtime.debug("updated remote package status")
  }

  return this
}
