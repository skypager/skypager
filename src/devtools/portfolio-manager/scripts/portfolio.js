const runtime = require('@skypager/node').use(require('..'))
const {
  clear,
  print,
  randomBanner,
  colors: { yellow, green, red },
} = runtime.cli
const portfolio = runtime.feature('portfolio-manager')

async function main() {
  const commands = runtime.argv._
  const command = commands[0] || 'help'

  clear()
  randomBanner('Skypager')

  if (command === 'help') {
    showHelp()
    return
  }

  await portfolio.enable()
  await portfolio.whenReady()
  await runtime.fsx.mkdirpAsync(runtime.resolve('build', portfolio.packageName, portfolio.version))

  if (command === 'dump') {
    await dump()
    return
  }

  if (command === 'export') {
    await runExport(...commands.slice(1))
  }

  if (command === 'restore') {
    await runRestore(...commands.slice(1))
  }
}

async function runRestore(slice = 'builds') {
  const { versionMap } = portfolio.packageManager

  await portfolio.packageManager.checkRemoteStatus()

  if (slice === 'builds') {
    await Promise.all(
      portfolio.scopedPackageNames
        .filter(name => name !== portfolio.packageName)
        .map(packageName => {
          print(`Restoring ${packageName} ${versionMap[packageName]}`)
          restore(packageName, versionMap[packageName])
        })
    )
  }
}

async function restore(packageName, requestedVersion) {
  try {
    const buildFolders = await portfolio.restore(packageName, requestedVersion, {
      overwrite: !!runtime.argv.overwrite,
    })

    if (buildFolders.length) {
      print(`${green('Restored')} ${packageName}@${requestedVersion}`)
      print(buildFolders, 4)
    } else {
      print(`${yellow('Skipped')} ${packageName}@${requestedVersion}`)
    }
  } catch (error) {
    print(`${red('Error')} restoring ${packageName}`)
    print(error.message, 2)
  }
}

async function runExport(slice = 'graphs') {
  await portfolio.fileManager.startAsync({ startPackageManager: true })
  await portfolio.startAsync()

  if (slice === 'all' || slice === 'graphs' || slice.match(/module/)) {
    await portfolio.moduleManager.startAsync({ maxDepth: 1 })
    const data = await portfolio.moduleManager.exportGraph()
    await runtime.fsx.writeJsonAsync(
      runtime.resolve('build', portfolio.packageName, portfolio.version, 'modules-graph.json'),
      data
    )
  }

  if (slice === 'all' || slice === 'graphs' || slice.match(/(package|project)/)) {
    const data = await portfolio.packageManager.exportGraph()
    await runtime.fsx.writeJsonAsync(
      runtime.resolve('build', portfolio.packageName, portfolio.version, `packages-graph.json`),
      data
    )
  }

  if (slice === 'files' || slice === 'all') {
    const projects = portfolio.scopedPackageNames.filter(name => name !== portfolio.packageName)
    await Promise.all(projects.map(dumpFileTree))
  }
}

async function dump() {
  await portfolio.fileManager.startAsync({ startPackageManager: true })
  await portfolio.startAsync()
  const portfolioState = await portfolio.dump()

  await runtime.fsx.writeJsonAsync(
    runtime.resolve('build', portfolio.packageName, portfolio.version, 'dump.json'),
    portfolioState
  )
}

async function dumpFileTree(projectName) {
  const pkg = portfolio.packageManager.findByName(projectName)
  const tree = await portfolio.dumpFileTree(projectName)
  const projectRoot = runtime.resolve('build', ...projectName.split('/'))
  const folder = runtime.resolve(projectRoot, pkg.version)
  await runtime.fsx.mkdirpAsync(folder)
  await runtime.fsx.writeJsonAsync(runtime.resolve(folder, 'source.json'), tree)
  return tree
}

function showHelp() {
  process.exit(0)
}

main()
