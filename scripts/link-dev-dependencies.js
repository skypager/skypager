const run = require('./shared/run')
const { selectApplication, colors, showHeader, print } = require('./shared/cli')
const { projectTask } = run

/**
 * --static : use the serve package to serve the static built site
 * --docker : run a docker container after it has been packaged
 * --build : build the site, only applicable when using --static
 * --port : which port to listen on
 */
run(async runtime => {
  const apps = await runtime.select('development/applications')

  // i think we can remove the copy / vendor package.json as they're not needed with our new deployment system
  const projectRoots = apps
    .map(p => p._file.dir)
    .filter(dir => dir !== runtime.cwd && !dir.match(/\/copy|vendor\/?/))

  await Promise.all(
    projectRoots.map(subfolder => runtime.fsx.mkdirpAsync(runtime.resolve(subfolder)))
  )

  // This is so we don't have to explicitly depend on e.g. mocha in a subproject
  // to make it available to run mocha from inside of the subroject folder
  print(`Creating symlinks to portfolio devDependency .bin files.`)

  const linkDep = name =>
    Promise.all(
      projectRoots.map(subfolder =>
        runtime.fsx.ensureSymlinkAsync(
          // this could be dynamic and we can add a list of dev dependencies to link
          runtime.resolve('node_modules', '.bin', name),
          runtime.resolve(subfolder, 'node_modules', '.bin', name)
        )
      )
    )

  //  await linkDep('serve')
  await linkDep('webpack')
  await linkDep('webpack-dev-server')
  await linkDep('skypager')
  await linkDep('mocha-webpack')
  await linkDep('babel')
})
