const run = require('./shared/run')
const { selectApplication, colors, showHeader, print } = require('./shared/cli')
const { projectTask } = run

run(async runtime => {
  // scripts/build internet-of-insurance
  let [app] = runtime.argv._

  showHeader()

  // gives us a lodash chain sequence we can reuse
  const apps = await runtime
    .selectChain('development/applications')
    .then(chain => chain.filter(app => app.name.startsWith('@skypager')))
    .then(chain => chain.keyBy(app => app.name.replace(/^@skypager\//, '')))

  const appNames = apps.keys().value()

  if (!app || appNames.indexOf(app.toLowerCase()) === -1) {
    app = await selectApplication(appNames)
  }

  const workingDir = apps
    .get(app)
    .get('_file.dir')
    .value()

  await projectTask(workingDir, 'watch', process.argv.slice(3))

  print(colors.green('SUCCESS'), 0, 2, 2)
})
