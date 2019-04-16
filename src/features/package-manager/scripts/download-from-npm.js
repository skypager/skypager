const runtime = require('@skypager/node')

const { currentPackage, fileManager, packageManager, argv } = runtime
const { colors, print } = runtime.cli
const { castArray } = runtime.lodash

const buildFolders = ['dist', 'lib', 'build']
  .concat(castArray(argv.buildFolder))
  .filter(v => v && v.length)

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

  if (currentPackage.private) {
    print(`Skipping NPM download for private package: ${currentPackage.name}`)
    process.exit(0)
  }

  await fileManager.startAsync({ startPackageManager: true })
  const modifiedFiles = runtime.git.modifiedFiles
    .map(file => runtime.pathUtils.resolve(runtime.gitInfo.root, file))
    .filter(file => file.startsWith(runtime.cwd))

  if (modifiedFiles.length && !argv.force) {
    print(
      `Skipping ${currentPackage.name} download.  This project has local changes, try building.`
    )
    print(modifiedFiles.map(f => `- ${runtime.relative(f)}`), 4)
    process.exit(0)
  }

  await download({ name: currentPackage.name, destination: runtime.cwd })
}

async function download({ name, destination }) {
  await packageManager.findAuthToken()

  const result = await packageManager.downloadPackage(name, {
    dryRun: !!argv.dryRun,
    verbose: !!argv.verbose,
    folders: buildFolders,
    extract: true,
    destination,
  })

  print(
    `Downloaded ${currentPackage.name} version ${currentPackage.version} from NPM. ${
      result.extracted.length
    } total asset(s)`
  )
  print(`${currentPackage.name} Build Directories:`)
  print(result.destinationDirectories.map(dir => `- ${runtime.relative(dir)}`), 4)
}

function displayHelp() {
  runtime.cli.randomBanner('Skypager')
  console.log(
    `
  Downloads build artifacts for this package to npm 

    --dry-run   don't actually replace anything anything
    --verbose   when doing a dry run, print out all of the copy commands 
    --force     proceed with download even if the project has changes
  `.trim()
  )
}
