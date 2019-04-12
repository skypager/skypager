const runtime = require('@skypager/node').use(require('..'))
const {
  clear,
  print,
  randomBanner,
  icon,
  colors: { yellow, green, red, underline: u },
} = runtime.cli

const portfolio = runtime.feature('portfolio-manager')
const { max, padEnd } = runtime.lodash

async function main() {
  const commands = runtime.argv._
  const command = commands[0] || 'help'

  clear()
  randomBanner('Skypager')
  print(`Portfolio Manager Task Runner`)

  if (command === 'help') {
    showHelp()
    return
  }

  await portfolio.enable()
  print(`Starting up the portfolio services.`)
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

  if (command === 'check') {
    await runCheck(...commands.slice(1))
  }
}

async function runCheck(slice = 'builds', checkType) {
  if (slice === 'builds' || slice === 'build' || slice === 'all') {
    if (!checkType || checkType === 'status') {
      await checkPackagesThatNeedToBeBuilt({
        build: (runtime.argv.fix || runtime.argv.build) && !runtime.argv.dryRun,
        restore: !runtime.argv.build && runtime.argv.restore && !runtime.argv.dryRun,
      })
    }
  }
}

async function checkPackagesThatNeedToBeBuilt(options = {}) {
  await portfolio.hashProjectTrees()

  const checks = await Promise.all(
    portfolio.scopedPackageNames
      .filter(name => name !== portfolio.packageName)
      .map(packageName =>
        checkIfBuildIsRequired(packageName, options)
          .then((info = {}) => ({
            ...info,
            packageName,
          }))
          .catch(error => {
            if (error.message === 'MISSING_BUILD') {
              return {
                packageName,
                result: true,
                message: 'Project has not been built.',
              }
            } else if (error.message === 'NO_MANIFEST' && !error.retried) {
              return {
                packageName,
                result: true,
                message: 'Project is missing the build manifest.',
              }
            } else if (error.message === 'PROJECT_NOT_FOUND') {
              return {
                packageName,
                result: false,
                message: 'Project not found in the portfolio.',
              }
            }
          })
      )
  )

  if (!checks.find(check => check.result)) {
    print(
      `${icon(
        'rocket'
      )}  Everything looks NICE.  All projects have the correct build hash to match their current source tree.`
    )
    return
  }

  const needsRebuild = checks.filter(check => check.result && check.message.match(/match/))
  const notBuilt = checks.filter(check => check.result && check.message.match(/not been built/))

  if (notBuilt.length) {
    console.log('')
    print(u(`The following packages have not been built:`))
    print(notBuilt.map(({ packageName }) => packageName), 4)
  }

  const padding = max(needsRebuild.map(p => p.packageName.length)) + 6

  console.log('')
  print(u(`The following packages need to be rebuilt:`))
  print(
    needsRebuild.map(({ packageName, message }) => `${padEnd(packageName, padding)} ${message}`),
    4
  )

  if (!options.restore && !options.build && !options.fix) {
    console.log('\n\n')
    print(`Passing the --build or --restore flag can automatically remedy this.`)
    print(`--restore will download the build artifacts from npm.`)
    print(`--build will build the artifacts locally.`)
    console.log('\n\n')
    return
  }

  if (options.restore) {
    print(`Please wait while we restore your projects from NPM.`)
    await restoreProjects(checks.filter(check => check.result))
  } else if (options.build) {
    print(`Please wait while we build your projects.`)
    await buildProjects(checks.filter(check => check.result))
  }
}

async function restoreProjects(checks = []) {
  const { versionMap } = portfolio.packageManager
  return Promise.all(checks.map(({ packageName }) => restore(packageName, versionMap[packageName])))
}

async function buildProjects(checks = []) {
  const queue = checks.map(c => c.packageName)
  const sorted = await portfolio.packageManager
    .sortPackages()
    .then(list => list.filter(item => queue.indexOf(item) !== -1))

  const tasks = sorted.map(name => `${name}/build`)

  await portfolio.portfolioRuntime.proc.async.spawn(
    'skypager',
    ['run-all'].concat(tasks).concat(['--progress']),
    {
      stdio: 'inherit',
    }
  )
}

async function checkIfBuildIsRequired(packageName, options = {}) {
  let { buildFolders = ['build', 'dist', 'lib'] } = options
  const project = portfolio.packageManager.findByName(packageName)

  if (!project) {
  }

  // the project doesn't require being built
  if (
    !project.scripts ||
    !project.scripts.build ||
    (project.scripts.build && project.scripts.build === 'exit 0')
  ) {
    return {
      result: false,
      packageName,
      message: `This package does not require building.`,
    }
  }

  if (project && project.skypager && project.skypager.buildFolder) {
    buildFolders = [project.skypager.buildFolder]
  }

  if (project && project.skypager && project.skypager.buildFolders) {
    buildFolders = project.skypager.buildFolders
  }

  const { dir: cwd } = project._file
  const checkBuildFolders = buildFolders.map(p => runtime.pathUtils.resolve(cwd, p))
  const existingBuildFolders = await runtime.fsx.existingAsync(...checkBuildFolders)

  // there are no build folders, we obviously need to build
  if (!existingBuildFolders.length) {
    const error = new Error(`MISSING_BUILD`)
    error.packageName = packageName
    error.buildFolders = buildFolders
    error.cwd = cwd
    error.checkBuildFolders = checkBuildFolders
    error.existingBuildFolders = existingBuildFolders
    throw error
  }

  const buildManifests = existingBuildFolders.map(folder =>
    runtime.pathUtils.resolve(folder, 'build-manifest.json')
  )
  const existingManifests = await runtime.fsx.existingAsync(...buildManifests)

  // there aren't any manifests, we should build to be safe
  if (!existingManifests.length) {
    const error = new Error(`NO_MANIFEST`)
    error.cwd = cwd
    error.packageName = packageName
    error.checkBuildFolders = checkBuildFolders
    error.existingBuildFolders = existingBuildFolders
    error.buildManifests = buildManifests
    throw error
  }

  const record = portfolio.projects.get(packageName)

  if (!record) {
    const error = new Error(`PROJECT_NOT_FOUND`)
    error.cwd = cwd
    error.packageName = packageName
    error.checkBuildFolders = checkBuildFolders
    error.existingBuildFolders = existingBuildFolders
    error.buildManifests = buildManifests
    throw error
  }

  const results = await Promise.all(
    existingManifests.map(p =>
      runtime.fsx.readJsonAsync(p).then(({ cacheKey, sourceHash }) => ({
        manifest: p,
        actual: sourceHash,
        match: sourceHash === record.sourceHash,
        current: record.sourceHash,
      }))
    )
  )

  return results.reduce(
    (memo, { actual, current, match } = {}) => {
      if (!match) {
        memo.result = true
        memo.message = `actual: ${actual.substr(0, 8)} expected: ${current.substr(0, 8)}`
      }

      return memo
    },
    { packageName }
  )
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

async function dumpFileTree(packageName) {
  const pkg = portfolio.packageManager.findByName(packageName)
  const tree = await portfolio.dumpFileTree(packageName)
  const projectRoot = runtime.resolve('build', ...packageName.split('/'))
  const folder = runtime.resolve(projectRoot, pkg.version)
  await runtime.fsx.mkdirpAsync(folder)
  await runtime.fsx.writeJsonAsync(runtime.resolve(folder, 'source.json'), tree)
  return tree
}

function showHelp() {
  process.exit(0)
}

main()
