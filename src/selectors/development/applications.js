async function selectDevelopmentApplications(chain, options = {}) {
  const { packageManager } = this

  await packageManager.startAsync()

  return packageManager.chain.get('packageData')
}

module.exports = selectDevelopmentApplications
