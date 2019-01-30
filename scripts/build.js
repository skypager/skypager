const run = require('./shared/run')
const { selectApplication, colors, showHeader, print } = require('./shared/cli')
const { projectTask } = run

run(async runtime => {
  let [app] = runtime.argv._

  showHeader()

  // gives us a lodash chain sequence we can reuse
  const apps = await runtime
    .selectChain('development/applications')
    .then(chain => chain.filter(app => app.name.startsWith('@skypager')))
    .then(chain => chain.keyBy(app => app.name.replace(/^@skypager\//, '').replace(/^apps-/, '')))

  const appNames = apps.keys().value()

  if (!app || appNames.indexOf(app.toLowerCase()) === -1) {
    app = await selectApplication(appNames)
  }

  const workingDir = apps
    .get(app)
    .get('_file.dir')
    .value()

  await projectTask(workingDir, 'build', process.argv.slice(3), {
    stdio: process.env.CI ? 'inherit' : 'ignore',
  })

  print(colors.green('SUCCESS'), 0, 2, 2)
})
