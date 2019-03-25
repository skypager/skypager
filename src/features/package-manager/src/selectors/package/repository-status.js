export default (async function repositoryStatus(chain, options = {}) {
  const runtime = this
  const { fileManager } = runtime
  const { packageManager } = runtime

  await fileManager.whenActivated()
  await packageManager.whenActivated()

  if (typeof options === 'string') {
    options = { packages: [options] }
  }

  const { filter = Boolean, packages = packageManager.packageNames.filter(filter) } = options

  const checkRepoWithCLI = packageName => {
    return runtime.proc
      .spawnAndCapture({
        cmd: 'npm',
        args: ['info', packageName, '--json'],
      })
      .then(response => {
        return JSON.parse(response.normalOutput.join(''))
      })
  }

  const checkRepoWithAPI = async packageName => {
    const client = await packageManager.npmClient(this.lodash.pick(options, 'registry', 'npmToken'))
    return client.fetchPackageInfo(packageName)
  }

  const checkRepo = packageName =>
    options.api ? checkRepoWithAPI(packageName) : checkRepoWithCLI(packageName)

  const results = await Promise.all(
    packages.map(packageName =>
      checkRepo(packageName)
        .then(data => [packageName, data])
        .catch(e => [packageName, e])
    )
  )

  return chain
    .plant(results)
    .fromPairs()
    .mapValues(json => {
      try {
        return typeof json === 'string' ? JSON.parse(json) : json
      } catch (error) {
        this.error('error checking package status')
        return { error }
      }
    })
    .omitBy(v => !v)
})
