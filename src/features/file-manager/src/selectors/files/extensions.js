export default (async function extensions(chain, baseFolder) {
  const skypager = this
  const base = baseFolder ? skypager.resolve(baseFolder) : skypager.cwd

  return chain
    .invoke('fileManager.files.values')
    .filter(file => file.path.startsWith(base) && file.extension.length)
    .map(file => file.extension)
    .uniq()
})
