module.exports = function(resolve, server) {
  const { runtime } = server
  const { portfolio } = runtime
  const { entries } = runtime.lodash
  const { packageManager, moduleManager } = portfolio

  const pkg = name => {
    const local = packageManager.findByName(name)

    if (local) {
      return formatManifest(local)
    }

    const entry = moduleManager.findByName(name) || {}
    const npm = entries(entry)[0][1]

    if (npm) {
      return formatManifest(npm)
    }

    return npm
  }

  const toList = obj => entries(obj).map(([name, value]) => ({ name, value }))

  function formatManifest(manifest) {
    return {
      ...manifest,
      scripts: toList(manifest.scripts),
    }
  }
  resolve('Query.packages', async (current, args, context) => {
    return packageManager.packageData.map(formatManifest)
  })

  resolve('Package.dependencies', async (current, args, context) => {
    const { dependencies } = current

    return entries(dependencies).map(([targetName, version]) => ({
      target: pkg(targetName),
      type: 'devDependency',
      source: current,
      version,
    }))
  })

  resolve('Package.devDependencies', async (current, args, context) => {
    const { devDependencies } = current

    return entries(devDependencies).map(([targetName, version]) => ({
      target: pkg(targetName),
      type: 'devDependency',
      source: current,
      version,
    }))
  })

  return true
}
