export default (async function discoverHelpers(chain, options = {}) {
  const helperNames = chain
    .get('allHelpers')
    .invokeMap('registryName')
    .value()

  const searchFor = helperName =>
    this.git
      .lsFiles({ pattern: `**/${helperName}/**`, full: true, fullName: true })
      .then(lines => lines.filter(l => l && l.length))
      .catch(() => [])

  const results = await Promise.all(helperNames.map(searchFor))

  return chain.plant(this.lodash.zipObject(helperNames, results)).omitBy(v => !v.length)
})
