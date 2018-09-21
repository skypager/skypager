async function selectDevelopmentApplications(chain, options = {}) {
  const { fileManager, packageManager } = this

  await fileManager.startAsync()
  await packageManager.startAsync()

  return packageManager.chain.get('packageData')
}

module.exports = selectDevelopmentApplications
