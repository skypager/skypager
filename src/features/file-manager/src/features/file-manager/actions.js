export function attach(options = {}) {
  const fileManager = this
  const { runtime } = fileManager
  const { mapValues, omit } = runtime.lodash

  const actions = mapValues(omit(module.exports, "default", "attach"), (fn, name) => [
    "action",
    fn.bind(fileManager)
  ])

  runtime.makeObservable(actions, fileManager)

  return fileManager
}

export function loadRoutes(...routes) {
  const { runtime } = this
  const { flatten, uniqBy } = runtime.lodash
  const matches = flatten(routes.map(route => runtime.fileManager.router.get(route)))
  Promise.all(uniqBy(matches, match => match.path).map(file => file.readContent()))
}

export function updateFileAST({ file, hash, ast, type } = {}) {
  const { runtime } = this
  const existing = runtime.fileManager.asts.get(file) || {}

  runtime.fileManager.asts.set(file, {
    ...existing,
    [type]: { type, file, hash, ast }
  })
}

export function updateFileCompilation({ file, hash, compilation, type } = {}) {
  const { runtime } = this
  const existing = runtime.fileManager.compiled.get(file) || {}

  runtime.fileManager.compiled.set(file, {
    ...existing,
    [type]: { file, hash, compilation, type }
  })
}

export function updateFileHash(key, hash) {
  const { runtime } = this
  const file = runtime.fileManager.files.get(key)
  file.hash = hash
  runtime.fileManager.emit("willUpdateFileHash", { key, file, hash })
  runtime.fileManager.files.set(key, file)
}

export function updateFileContent(key, content = "") {
  const { runtime } = this
  const { dirname } = runtime.pathUtils

  const { memoryFileSystem: fs } = this

  const file = runtime.fileManager.files.get(key)

  try {
    fs.mkdirpSync(dirname(file.path))
    fs.writeFileSync(file.path, content.toString())
    file.content = content.toString()
  } catch (error) {
    file.error = error
  }

  runtime.fileManager.files.set(key, file)

  return runtime.fileManager.files.get(key)
}
