export default (async function selectModuleMaintainers(chain, options = {}) {
  const skypager = this

  !skypager.moduleManager && skypager.feature('module-manager').enable()

  await skypager.moduleManager.startAsync()

  const report = new Map()

  const { isString, castArray, isEmpty, fromPairs, mapValues } = skypager.lodash

  const counts = () => mapValues(fromPairs(report.toJSON()), 'size')

  return chain
    .get('moduleManager.packageData', [])
    .reject(p => isEmpty(p.author))
    .keyBy('name')
    .mapValues(v => ({
      author: normalizeAuthorField(v.author),
      contributors: normalizeContributorsField(v.contributors),
    }))
    .mapValues((data, name) => {
      if (!report.has(data.author)) {
        report.set(data.author, new Set())
        report.get(data.author).add(name)
      }

      return data
    })
    .thru(byPackageName => ({
      byPackageName,
      counts: counts(),
    }))

  function normalizeContributorsField(contributors) {
    return isEmpty(contributors) ? [] : castArray(contributors).map(n => normalizeAuthorField(n))
  }

  function normalizeAuthorField(author) {
    let authorName = isString(author) ? author : author.name

    authorName = authorName
      .split(' ')
      .filter(f => !f.match(/^\W/))
      .join(' ')

    return `${authorName || 'Unknown'}`
  }
})
