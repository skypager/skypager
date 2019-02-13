const runtime = require('@skypager/node').use(require('@skypager/portfolio-manager'))
const { clear, print, randomBanner } = runtime.cli
const { green } = runtime.cli.colors

async function main() {
  clear()
  randomBanner('Skypager')
  print('Downloading Package Tarballs from NPM')

  const { portfolio } = runtime

  await runtime.start()
  await runtime.fileManager.startAsync({ startPackageManager: true })
  await portfolio.packageManager.checkRemoteStatus()

  const { scopedPackageNames } = portfolio

  await Promise.all(
    portfolio.packageManager.remoteEntries.map(([packageName, remote]) => {
      if (
        remote &&
        remote.dist &&
        scopedPackageNames.indexOf(packageName) !== -1 &&
        packageName !== runtime.currentPackage.name
      ) {
        return download(remote).then(() => extract(remote))
      } else {
      }
    })
  )
}

async function extract({ name, version, dist: { tarball } } = {}) {
  const destination = runtime.resolve('build', name, version, `package-${version}.tgz`)
  const exists = await runtime.fsx.existsAsync(destination)
  const folder = runtime.pathUtils.dirname(destination)

  if (!runtime.argv.extract) {
    return
  }

  if (exists) {
    await runtime.proc.async.spawn('tar', ['zxvf', destination], {
      cwd: folder,
    })

    const items = await runtime.fsx.readdirAsync(runtime.resolve(folder, 'package'))

    if (items.indexOf('lib') !== -1) {
      await runtime.fsx.copyAsync(
        runtime.resolve(folder, 'package', 'lib'),
        runtime.resolve(folder, 'lib')
      )
    }

    if (items.indexOf('dist') !== -1) {
      await runtime.fsx.copyAsync(
        runtime.resolve(folder, 'package', 'dist'),
        runtime.resolve(folder, 'dist')
      )
    }

    if (items.indexOf('build') !== -1) {
      await runtime.fsx.copyAsync(
        runtime.resolve(folder, 'package', 'build'),
        runtime.resolve(folder, 'build')
      )
    }

    await runtime.fsx.copyAsync(
      runtime.resolve(folder, 'package', 'package.json'),
      runtime.resolve(folder, 'package.json')
    )
  }

  if (runtime.argv.clean !== false) {
    await runtime.fsx.removeAsync(runtime.resolve(folder, 'package'))
  }
}

async function download({ name, version, dist: { tarball } } = {}) {
  const destination = runtime.resolve('build', name, version, `package-${version}.tgz`)
  const exists = await runtime.fsx.existsAsync(destination)

  print(`${name}@${green(version)}`)

  if (exists) {
    return destination
  }

  const folder = runtime.pathUtils.dirname(destination)

  await runtime.fsx.mkdirpAsync(folder)
  await runtime.fileDownloader.downloadAsync(tarball, runtime.relative(destination))

  return destination
}

main()
