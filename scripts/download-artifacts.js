const runtime = require('@skypager/node')

const { argv, fileManager, packageManager } = runtime
const { colors, print } = runtime.cli

const buildFolders = ['dist', 'lib', 'build']

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
  await fileManager.startAsync({ startPackageManager: true })
  const { packageData } = packageManager

  await Promise.all(
    packageData
      .filter(
        pkg =>
          pkg.name.startsWith('@skypager') &&
          !pkg.private &&
          (!runtime.argv.only || runtime.argv.only === pkg.name)
      )
      .map(pkg => download(pkg))
  )
}

async function download(pkg) {
  const result = await packageManager.downloadPackage(pkg.name, {
    // dryRun: true,
    replace: true,
    folders: buildFolders,
    extract: true,
  })

  console.log(result)
  // print(`${colors.green(pkg.name)}: Downloaded ${result.extracted.length} artifacts.`)
}
