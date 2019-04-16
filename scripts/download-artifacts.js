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
  if (runtime.argv.help || runtime.argv._.find(a => a.toLowerCase() === 'help')) {
    displayHelp()
    process.exit(0)
  }

  await fileManager.startAsync({ startPackageManager: true })
  const { packageData } = packageManager
  const { castArray } = runtime.lodash
  const exclude = castArray(runtime.argv.exclude).filter(v => v && v.length)
  const include = castArray(runtime.argv.include).filter(v => v && v.length)

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

  const scope = runtime.currentPackage.name.split('/')[0]

  await Promise.all(
    packageData
      .filter(pkg => pkg.name.startsWith(scope) && !pkg.private)
      .filter(
        pkg =>
          !include.length ||
          !!include.find(arg =>
            arg.match(/\*/)
              ? new RegExp(arg.replace(/\*/, '.*')).test(pkg.name)
              : arg.toLowerCase() === pkg.name
          )
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

function displayHelp() {
  runtime.cli.randomBanner('Skypager')
  console.log(
    `

  Downloads build artifacts for all of your packages from npm
    --exclude-updated         don't download any package that has been updated (using lerna updated)
    --dry-run                 don't actually replace anything anything

    the following flags can be supplied multiple times

    --exclude <packageName>   don't download the specified package. use * for wildcard matches
    --include <packageName>   only download the specified package. use * for wildcard matches
  `.trim()
  )
}
