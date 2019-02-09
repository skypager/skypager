export default (async function repositoryStatus(chain, options = {}) {
  const runtime = this
  const { fileManager } = runtime
  const { packageManager } = runtime

  await fileManager.startAsync({ startPackageManager: true })

  if (typeof options === 'string') {
    options = { packages: [options] }
  }

  const { packages = packageManager.packageNames } = options

  const checkRepo = packageName =>
    runtime.proc.async
      .exec(`npm info ${packageName} --json`)
      .then(c => String(c.stdout))
      .catch(error => {
        return false
      })

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
