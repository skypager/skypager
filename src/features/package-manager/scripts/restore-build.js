const runtime = require('@skypager/node')

const { fileManager, packageManager, git, argv } = runtime
const { colors, print } = runtime.cli

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    print(colors.red('ERROR'))
    print(colors.red(error.message))
    process.exit(1)
  })

async function main() {
  if (argv.help || argv._.find(a => a.toLowerCase() === 'help')) {
    displayHelp()
    process.exit(0)
  }

  const {
    buildManifest = 'build-manifest.json',
    buildCommand = 'build',
    downloadCommand = 'skypager download-from-npm',
  } = argv

  if (fileManager.packageLocations.length === 1) {
    if (git.modifiedSince().length) {
      print(`Package has been modified. Running build command`)
    } else {
      print(`Package has not been modified. Running download command`)
    }
  }

  const { difference } = runtime.lodash

  await fileManager.startAsync({ startPackageManager: true })

  const tag = runtime.git.findLatestTag()
  const packageNames = packageManager.packageData
    .filter(
      pkg =>
        pkg &&
        pkg.name &&
        !pkg._file.dir.match(/(test|spec).fixtures/) &&
        (argv.includeRoot || pkg._file.dir !== runtime.gitInfo.root)
    )
    .map(p => p.name)

  const changedPackages = await packageManager.selectModifiedPackages({ since: tag, names: true })

  const downloadList = difference(packageNames, changedPackages)
  const buildList = changedPackages

  print(`Running download command: ${downloadCommand} in`)
  print(downloadList.map(n => `- ${n}`), 4)
  print(`Running build command: ${buildCommand} in`)
  print(buildList.map(n => `- ${n}`), 4)
}

main()

function displayHelp() {
  runtime.cli.randomBanner('Skypager')
  console.log(
    `
  Restores the current packages build artifacts.  If there are no local changes to the package, it will attempt 
  to download the artifacts from npm. If there are local changes, then it will run the package build command.

  --build-command <cmd>        package.json script, or shell command to build the project
  --download-command <cmd>     package.json script, or shell command to download the build artifacts
  --build-manifest <filename>  the name of the json file which contains the build manifest that includes 
                               a sourceHash property
  --include-root               by default, we'll skip the root package in a monorepo. pass true to include it anyway.
  `.trim()
  )
}
