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

  const {
    buildManifest = 'build-manifest.json',
    buildCommand = 'build',
    downloadCommand = 'skypager download-from-npm',
  } = argv

  await fileManager.startAsync({ startPackageManager: true })

  await Promise.all([])
}

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
  `.trim()
  )
}
