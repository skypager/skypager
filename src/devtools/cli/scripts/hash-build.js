const runtime = require('@skypager/node')

main().catch(error => {
  console.log('Error Generating Build Hash')
  console.log(error.message)
  process.exit(0)
})

async function main() {
  const requestedHelp = runtime.argv.help || runtime.argv._[0] === 'help'

  if (requestedHelp) {
    displayHelp()
  } else {
    return handler()
  }
}

function displayHelp() {
  const { colors, randomBanner, print } = runtime.cli

  randomBanner('Skypager')
  print(colors.bold.underline(`Skypager Build Hash Utility`), 0, 0, 1)

  console.log(
    `
  Generates a manifest which contains a source hash, and a build hash.

  Source hash is calculated by collecting all of the files (excluding any .gitignored)
  and getting their MD5 content hash.  It will combine all of these values into a single hash value.  
  
  This value will change whenever any of the source content changed.

  Build hash is a similar process, but it only looks in the build folders (dist, build, lib) for build artifacts,
  and ignores the build manifest.

  Before you generate a build, you can look and see if the source hash already exists, 
  and compare it to the hash of the build artifacts.

  This can be used to verify that the current build artifacts are valid, or if a rebuild is required.

  ${colors.bold.underline('Usage')}:
  
    $ skypager hash-build 

  ${colors.bold.underline('Options')}:
  
    --hash-file <fileName>   specify the build hash output file name (default build-manifest.json)

  `.trim()
  )
}

async function handler() {
  const runtime = require('@skypager/node').use(require('@skypager/features-file-manager'))

  runtime.feature('file-manager').enable()

  const {
    print,
    colors: { green, cyan },
  } = runtime.cli

  await runtime.fileManager.startAsync()

  const { hashFile: outputFilename = 'build-manifest.json' } = runtime.argv

  const buildFolderNames = ['dist', 'build', 'lib']

  const topLevel = await runtime.fsx.readdirSync(runtime.cwd)
  const directories = await Promise.all(
    topLevel.map(name =>
      runtime.fsx
        .statAsync(runtime.resolve(name))
        .catch(error => false)
        .then(stats => (stats && stats.isDirectory() ? name : false))
    )
  ).then(results => results.filter(Boolean))

  const { basename } = runtime.pathUtils
  let buildFolders = directories.filter(dir => buildFolderNames.indexOf(basename(dir)) !== -1)

  buildFolders = await runtime.fsx.existingAsync(...buildFolders)

  const hashTables = await Promise.all(
    buildFolders.map(baseFolder =>
      runtime.fileManager
        .hashBuildTree({ baseFolder, exclude: [new RegExp(`${outputFilename}$`)] })
        .then(hashTable =>
          runtime.fsx
            .writeFileAsync(
              runtime.resolve(baseFolder, outputFilename),
              JSON.stringify(hashTable, null, 2)
            )
            .then(() => hashTable)
        )
        .then(hashTable => {
          print(
            `${green(runtime.currentPackage.name)} Generated build hash ${cyan(
              hashTable.buildHash
            )} for ${baseFolder}`
          )
        })
    )
  )

  return hashTables
}
