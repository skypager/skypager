const run = require('./shared/run')
const { colors, showHeader, print } = require('./shared/cli')

run(async runtime => {
  showHeader()

  const { spawn, exec } = runtime.proc.async
  const apps = await runtime
    .selectChain('development/applications')
    .then(chain => chain.reject(app => app._file.dir.match(/\/(vendor|copy)/)))
    .then(chain => chain.filter(app => app.name.startsWith('@skypager')))
    .then(chain => chain.keyBy(app => app.name.replace(/^@skypager\//, '')))

  const portfolioVersion = apps.get('portfolio.version').value()
  const uiVersion = apps.get('ui.version').value()
  const themesLightVersion = apps.get(['themes-light', 'version']).value()
  const debug = !!(runtime.argv.debug || process.env.JOB_NAME)
  const stdio = debug ? 'inherit' : 'ignore'
})
