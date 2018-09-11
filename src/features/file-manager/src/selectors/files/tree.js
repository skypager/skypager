export default async function selectFileTree(chain, options = {}) {
  const skypager = this
  options = { ...this.options, ...options }

  const { fileManager } = skypager

  const { include = [], exclude = [], hashFiles = false, readContents = false } = options

  let { rootNode = 'src' } = options
  let rootNodePath = skypager.resolve(rootNode)

  if (rootNode === 'src') {
    const srcExists = await skypager.fsx.existsAsync(rootNodePath)

    if (!srcExists) {
      rootNode = ''
      rootNodePath = skypager.resolve(rootNode)
    }
  }

  await fileManager.whenActivated()

  if (readContents) {
    await fileManager.readContent({
      include: [path => path.startsWith(rootNodePath), ...include],
      exclude,
    })
  }

  if (hashFiles) {
    await fileManager.hashFiles({
      include: [path => path.startsWith(skypager.resolve(rootNode)), ...include],
      exclude,
    })
  }

  const fileIds = skypager.fileManager.fileIds.filter(f => f.startsWith(rootNode))

  return chain
    .plant(fileIds)
    .keyBy(v => v)
    .mapValues(fileId => skypager.fileManager.file(fileId))
    .pickBy(v => v)
}
