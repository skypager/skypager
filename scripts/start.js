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
  // scripts/build internet-of-insurance
  let [app] = runtime.argv._

  showHeader()

  // gives us a lodash chain sequence we can reuse
  const apps = await runtime
    .selectChain('development/applications')
    .then(chain =>
      chain.filter(app => app.name.startsWith('@skypager') && app.scripts && app.scripts.start)
    )
    .then(chain => chain.keyBy(app => app.name.replace(/^@skypager\//, '').replace(/^apps-/, '')))

  const appNames = apps.keys().value()

  if (!app || appNames.indexOf(app.toLowerCase()) === -1) {
    app = await selectApplication(appNames)
  }

  const workingDir = apps
    .get(app)
    .get('_file.dir')
    .value()

  if (runtime.argv.static) {
    if (runtime.argv.build) {
      await projectTask(workingDir, 'build')
    }

    await runtime.proc.async.spawn(
      'serve',
      ['-s', '--open', '--port', skypager.argv.port || 5001],
      {
        cwd: runtime.resolve(workingDir, 'build'),
        stdio: 'inherit',
      }
    )
  } else if (runtime.argv.docker) {
    const project = apps.get(app).value()
    await runtime.proc.async.spawn(
      'docker',
      [
        'run',
        '-p',
        `${runtime.argv.port || 5001}:5000`,
        '--env',
        `SKYPAGER_ENV=${runtime.argv.skypagerEnv || 'develop'}`,
        `datapimp/${project.name.replace(/@/, '')}:${project.version}`,
      ],
      {
        stdio: 'inherit',
      }
    )
  } else {
    await projectTask(workingDir, 'start')
  }
})
