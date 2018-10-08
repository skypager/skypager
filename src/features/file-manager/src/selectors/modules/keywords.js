export default (async function selectModuleKeywords(chain, options = {}) {
  const skypager = this

  !skypager.moduleManager && skypager.feature('module-manager').enable()

  await skypager.moduleManager.startAsync()

  const report = new Map()

  return chain
    .get('moduleManager.packageData', [])
    .reject(p => skypager.lodash.isEmpty(p.keywords))
    .keyBy('name')
    .mapValues('keywords')
    .mapValues((words, name) => {
      const keywords = [...(words || [])].map(k => skypager.stringUtils.snakeCase(k.toLowerCase()))

      keywords.forEach(k => {
        !report.has(k) && report.set(k, new Set())
        report.get(k).add(name)
      })

      return keywords
    })
    .thru(byPackageName => {
      return {
        byPackageName,
        counts: skypager.lodash.mapValues(skypager.lodash.fromPairs(report.toJSON()), v => v.size),
      }
    })
})
