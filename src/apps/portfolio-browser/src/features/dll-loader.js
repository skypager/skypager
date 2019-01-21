export const shortcut = 'dllLoader'

export const featureMixinOptions = {
  partial: [],
  insertOptions: false,
}

export const featureMethods = ['loadFromUnpkg']

/**
 * @param {object} dependencies - a map of packages and their global library name
 * @param {object} options - an options hash
 * @param {string} options.protocol - http or https
 */
export async function loadFromUnpkg(dependencies = {}, { protocol = 'https' } = {}) {
  const { entries, fromPairs } = this.lodash
  const { runtime } = this
  const { assetLoader } = runtime

  const modules = await Promise.all(
    entries(dependencies).map(([globalVariableName, packageName]) => {
      const unpkgUrl = packageName.startsWith('http')
        ? packageName
        : `${protocol}://unpkg.com/${packageName}`

      if (global[globalVariableName]) {
        return [packageName, global[globalVariableName]]
      }

      return assetLoader.inject.js(unpkgUrl).then(() => {
        return [packageName, global[globalVariableName]]
      })
    })
  ).then(fromPairs)

  return modules
}
