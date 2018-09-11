export const hostMethods = ["getFeatureFinder", "getFeatureFiles", "getFeatureFolders"]

export const featureMethods = ["findFeatureFolders", "findFeatureFiles"]

export function featureWasEnabled() {
  this.findFeatureFolders()
    .then((featureFolders = []) => this.runtime.setState({ featureFolders }))
    .then(() => this.findFeatureFiles())
    .then((featureFiles = []) => this.runtime.setState({ featureFiles }))
    .catch(error => {
      console.log("error", error.message)
    })
}

export function getFeatureFinder() {
  return this.feature("feature-finder")
}

export function getFeatureFolders() {
  return this.get("currentState.featureFolders", [])
}

export function getFeatureFiles() {
  return this.get("currentState.featureFiles", [])
}

export async function findFeatureFiles(options = {}) {
  const { base = "src" } = options
  const srcPath = (...args) => this.runtime.pathUtils.resolve(base, ...args)
  const { flatten } = this.runtime.lodash
  const { helperTags } = this.runtime

  const fileTags = flatten([
    helperTags.map(t => `${t}.js`),
    helperTags.map(t => `${t}.${this.runtime.target}.js`),
    helperTags.map(t => `${t}/index.js`),
    helperTags.map(t => `${t}/index.${this.runtime.target}.js`),
  ])

  const { featureFolders = [] } = this.runtime.currentState

  try {
    if (!featureFolders || !featureFolders.length) {
      await this.findFeatureFolders(options).then(results => featureFolders.push(...results))
    }

    const checkLocations = flatten(featureFolders.map(b => fileTags.map(t => srcPath(b, t))))

    const results = this.runtime.fsx.existingAsync(...checkLocations)

    return results
  } catch (error) {
    console.log("error", error)
    return []
  }
}

export async function findFeatureFolders(options = {}) {
  const { base = "src" } = options

  const srcPath = (...args) => this.runtime.join(base, ...args)

  const { flatten } = this.runtime.lodash
  const { helperTags } = this.runtime

  const checkLocations = flatten([
    srcPath("features"),
    srcPath("helpers/features"),
    srcPath("features/helpers"),
    helperTags.map(t => srcPath("features", t)),
    helperTags.map(t => srcPath("helpers/features", t)),
    helperTags.map(t => srcPath("features/helpers", t)),
  ])

  const results = await this.runtime.fsx.existingAsync(...checkLocations)

  return results
}
