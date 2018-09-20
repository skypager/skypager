const runtime = require('@skypager/node')
const serverHelper = require('@skypager/helpers-server')
const sheetsHelper = require('@skypager/helpers-sheet')
const { clear, randomBanner, print, colors } = runtime.cli

if (!runtime.server) {
  runtime.use(serverHelper)
}

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

  const server = runtime.server('app')

  if (runtime.argv.open) {
    runtime.opener.openInBrowser(`http://${server.hostname}:${server.port}`)
  }

  return server.start()
}

main()
