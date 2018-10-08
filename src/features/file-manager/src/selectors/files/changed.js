export default (async function(chain, directories = false) {
  const skypager = this

  await skypager.fileManager.whenActivated()

  const modified = skypager.git.modifiedFiles

  return chain.plant(modified).filter(path => skypager.fileManager.files.has(path))
})
