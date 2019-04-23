const runtime = require('@skypager/node')

const { currentPackage, fileManager, packageManager, moduleManager, argv } = runtime
const { colors, print } = runtime.cli
const { castArray, uniq } = runtime.lodash

const noYarnCache =
  argv.noCache || argv.cache === false || argv.noYarnCache || argv.yarnCache === false

const buildFolders = uniq(['dist', 'lib', 'build'].concat(argv._))
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

  try {
    const destination = argv.destination || runtime.cwd

    if (!noYarnCache) {
      const foundInCache = await moduleManager.findInYarnCache(
        currentPackage.name,
        currentPackage.version
      )

      if (foundInCache) {
        const existingBuildFolders = await runtime.fsx.existingAsync(
          ...buildFolders.map(f => runtime.resolve(foundInCache, f))
        )

        if (existingBuildFolders.length) {
          await Promise.all(
            existingBuildFolders.map(sourceDir =>
              runtime.fsx.copyAsync(
                sourceDir,
                runtime.resolve(destination, runtime.pathUtils.basename(sourceDir))
              )
            )
          )
          print(`Restored ${currentPackage.name} ${currentPackage.version} from yarn cache`)
          process.exit(0)
        }
      }
    }

    await download({ name: currentPackage.name, destination })
    process.exit(0)
  } catch (error) {
    console.error(`Error while downloading ${currentPackage.name}. ${error.message}`)
    if (runtime.argv.fail) {
      process.exit(1)
    }
  }
}

async function download({ name, destination }) {
  await packageManager.findAuthToken()

  const result = await packageManager.downloadPackage(name, {
    dryRun: !!argv.dryRun,
    verbose: !!argv.verbose,
    folders: buildFolders,
    extract: argv.extract !== false && !argv.noExtract,
    destination,
  })

  if (!argv.silent) {
    print(
      `Downloaded ${currentPackage.name} version ${currentPackage.version} from NPM. ${
        result.extracted.length
      } total asset(s)`
    )
    print(`${currentPackage.name} Build Directories:`)
    print(result.destinationDirectories.map(dir => `- ${runtime.relative(dir)}`), 4)
  }
}

function displayHelp() {
  runtime.cli.randomBanner('Skypager')
  console.log(
    `
  Downloads build artifacts for this package to npm 

    --destination   where to download the artifacts? defaults to current working directory 
    --dry-run       don't actually replace anything anything
    --verbose       when doing a dry run, print out all of the copy commands 
    --force         proceed with download even if the project has changes
    --no-extract    disable extracting the archive
  `.trim()
  )
}
