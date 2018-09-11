export default async function packageLocations(chain, options = {}) {
  const { dirname } = this.pathUtils
  const { manifestFile = 'package.json', parse = false, filter, include = [] } = options

  await this.fileManager.whenActivated()

  let response = chain.invoke('fileManager.selectMatches', [
    ...include,
    new RegExp(`${manifestFile}$`, 'i'),
  ])

  if (manifestFile.match(/.json$/) && parse && filter) {
    response = response.filter(file => {
      try {
        const data = JSON.parse(file.content)
        return filter(data, file)
      } catch (error) {
        return false
      }
    })
  } else if (filter) {
    response = response.filter(filter)
  }

  return response.map(file => (options.absolute ? file.dir : dirname(file.relative)))
}
