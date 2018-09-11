export default async function repositoryStatus(chain, options = {}) {
  const runtime = this
  const { fileManager } = runtime

  if (typeof options === "string") {
    options = { packages: [options] }
  }

  const { packages = fileManager.packageManager.manifests.values().map(p => p.name) } = options

  const checkRepo = packageName =>
    skypager.proc.async
      .exec(`npm info ${packageName} --json`)
      .catch(error => {
        return false
      })
      .then(c => c.stdout.toString())

  const results = await Promise.all(
    packages.map(packageName =>
      checkRepo(packageName).then(data => [packageName, data]).catch(e => [packageName, e])
    )
  )

  return chain
    .plant(results)
    .fromPairs()
    .mapValues(json => {
      try {
        return typeof json === "string" ? JSON.parse(json) : json
      } catch (error) {
        this.error("error checking package status")
        return { error }
      }
    })
    .omitBy(v => !v)
}
