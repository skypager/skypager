export default async function selectOutdatedRemotes(chain) {
  await this.packageManager.startAsync()
  await this.packageManager.checkRemoteStatus()

  const { latestMap } = this.packageManager

  return chain
    .get("packageManager.versionMap")
    .pickBy((version, packageName) => latestMap[packageName] !== version)
    .keys()
}
