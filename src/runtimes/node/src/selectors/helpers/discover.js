export default (async function discoverHelpers(chain, options = {}) {
  const runtime = this
  const { lazyAttached = [] } = runtime.currentState

  // trigger all the lazy loaders
  lazyAttached.map(prop => runtime[prop])

  const helperNames = chain
    .get('allHelpers')
    .invokeMap('registryName')
    .value()

  const searchFor = helperName =>
    this.git
      .lsFiles({ pattern: `**/${helperName}/**`, full: true, fullName: true })
      .then(lines => lines.filter(l => l && l.length && !l.match(/(spec|e2e|test)\.js/)))
      .catch(() => [])

  const results = await Promise.all(helperNames.map(searchFor))

  return chain.plant(this.lodash.zipObject(helperNames, results)).omitBy(v => !v.length)
})
