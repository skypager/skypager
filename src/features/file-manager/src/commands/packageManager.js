export function program(p) {
  return p
    .command('packageManager')
    .description('launch the file manager')
    .option('--base', 'the base folder to start from')
    .option('--ignore <pattern>', 'ignore a file pattern')
    .option('--doc-type <doctype>', 'load the given docType handles')
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
  const { fileManager } = runtime

  await fileManager.whenActivated()

  if (runtime.argv.updateCache) {
  }
}
