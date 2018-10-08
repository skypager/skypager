export default (async function selectPackageSnapshot(chain, options = {}) {
  const skypager = this
  const { packageManager, fileManager } = skypager

  await fileManager.startAsync()
  await packageManager.startAsync()

  return chain.plant(await packageManager.createSnapshot(options))
})
