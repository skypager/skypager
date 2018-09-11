const run = require('./shared/run')
const { showHeader, print } = require('./shared/cli')
const { projectTask } = run

run(async runtime => {
  // scripts/build internet-of-insurance
  let [app] = runtime.argv._

  showHeader()

  // gives us a lodash chain sequence we can reuse
  const apps = await runtime
    .selectChain('development/applications')
    .then(chain => chain.filter(app => app.name.startsWith('@skypager')).slice(1))

  const dirs = apps.map(p => p._file.dir).value()

  const paths = dirs
    .filter(dir => (!app || !app.length || app === 'all' ? true : dir.endsWith(`/${app}`)))
    .filter(dir => runtime.fsx.existsSync(runtime.pathUtils.resolve(dir, 'src')))
    .map(absolute => runtime.pathUtils.join(runtime.relative(absolute), 'src'))

  await Promise.all(
    paths.map(dir =>
      runtime.proc.async.exec(`prettier --write ${dir}/**/*.js`, { stdio: 'inherit' })
    )
  )
})
