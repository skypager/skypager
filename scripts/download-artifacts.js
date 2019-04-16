const runtime = require('@skypager/node')

const { argv, fileManager, packageManager } = runtime
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
  await fileManager.startAsync({ startPackageManager: true })
  const { packageData } = packageManager
  const { castArray } = runtime.lodash
  const exclude = castArray(runtime.argv.exclude).filter(v => v && v.length)

  if (runtime.argv.excludeUpdated) {
    exclude.push(
      ...JSON.parse(
        runtime.proc
          .execSync(`lerna updated --json`, {
            stdio: ['pipe', 'pipe', 'ignore'],
          })
          .toString()
      ).map(p => p.name)
    )
  }

  await Promise.all(
    packageData
      .filter(
        pkg =>
          pkg.name.startsWith('@skypager') &&
          !pkg.private &&
          (!runtime.argv.only || runtime.argv.only === pkg.name)
      )
      .filter(
        pkg =>
          !exclude.length ||
          !exclude.find(arg =>
            arg.match(/\*/)
              ? new RegExp(arg.replace(/\*/, '.*')).test(pkg.name)
              : arg.toLowerCase() === pkg.name
          )
      )
      .map(pkg => download(pkg))
  )
}

async function download(pkg) {
  await packageManager.downloadPackage(pkg.name, {
    dryRun: !!runtime.argv.dryRun,
    verbose: !!runtime.argv.verbose,
    folders: buildFolders,
    extract: true,
    destination: pkg._file.dir,
  })

  const downloaded = runtime.fsx
    .existingSync(...buildFolders.map(folder => runtime.resolve(pkg._file.dir, folder)))
    .map(folder => runtime.pathUtils.basename(folder))

  if (downloaded.length && !runtime.argv.silent) {
    console.log(
      `${pkg.name}: Downloaded and extracted ${downloaded.join()} to ${runtime.relative(
        pkg._file.dir
      )}`
    )
  }
}
