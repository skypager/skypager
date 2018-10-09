const runtime = require('@skypager/node')
const serverHelper = require('@skypager/helpers-server')
const sheetsHelper = require('@skypager/helpers-sheet')
const { clear, randomBanner, print, colors } = runtime.cli

if (!runtime.server) {
  runtime.use(serverHelper)
}

require('./install-secrets')

if (!runtime.sheet) {
  const { serviceAccount = runtime.resolve('secrets', 'serviceAccount.json') } = runtime.argv
  runtime.use(sheetsHelper, {
    serviceAccount,
    googleProject: require(serviceAccount).project_id,
  })
}

async function main() {
  clear()
  randomBanner('Skypager')
  print(`Starting Sheets Server`)
  await runtime.sheets.discover()
  print(`Google Cloud Project: ${runtime.google.settings.googleProject}`)

  runtime.servers.register('app', () => require('../src/server'))

  const server = runtime.server('app', {
    port: runtime.argv.port,
    hostname: runtime.argv.hostname,
  })

  if (runtime.argv.open) {
    runtime.opener.openInBrowser(`http://${server.hostname}:${server.port}`)
  }

  await server.start()

  if (runtime.argv.interactive) {
    await runtime.repl('interactive').launch({ server, runtime })
  }
}

main()
