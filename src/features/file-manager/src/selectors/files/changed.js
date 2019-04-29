export default (async function(chain, options = {}) {
  const skypager = this

  await skypager.fileManager.whenActivated()

  const modified = options.since
    ? skypager.git.modifiedSince(options.since)
    : skypager.git.modifiedFiles

  return chain.plant(modified).filter(path => skypager.fileManager.files.has(path))
})
