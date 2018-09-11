export default async function selectChangedPackages(chain, options = {}) {
  const packageLocations = await this.fileManager.packageLocations
  const changedFiles = await this.select("files/changed")

  return chain
    .plant(packageLocations)
    .filter(loc => changedFiles.find(f => f.startsWith(loc)))
    .sort(p => p.length)
    .uniq()
    .map(loc => this.pathUtils.join(loc, "package.json"))
}
