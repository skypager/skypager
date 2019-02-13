const runtime = require('@skypager/node')
const { print } = runtime.cli

main()

async function main() {
  await runtime.fileManager.startAsync()

  const buildFolderNames = ['dist', 'build', 'lib']

  const topLevel = await runtime.fsx.readdirSync(runtime.cwd)
  const directories = await Promise.all(
    topLevel.map(name =>
      runtime.fsx
        .statAsync(runtime.resolve(name))
        .then(stats => (stats.isDirectory() ? name : false))
    )
  ).then(results => results.filter(Boolean))

  const { basename } = runtime.pathUtils
  const buildFolders = directories.filter(dir => buildFolderNames.indexOf(basename(dir)) !== -1)

  const hashTables = await Promise.all(
    buildFolders.map(baseFolder =>
      runtime.fileManager
        .hashBuildTree({ baseFolder, exclude: [/build-manifest\.json$/] })
        .then(hashTable =>
          runtime.fsx
            .writeFileAsync(
              runtime.resolve(baseFolder, `build-manifest.json`),
              JSON.stringify(hashTable, null, 2)
            )
            .then(() => hashTable)
        )
        .then(hashTable => {
          print(`Generated build hash ${hashTable.buildHash} for ${baseFolder}`)
        })
    )
  )

  return hashTables
}
