const runtime = require('@skypager/node')
const serverHelper = require('@skypager/helpers-server')
const { clear, randomBanner, print, colors } = runtime.cli

if (!runtime.server) {
  runtime.use(serverHelper)
}

async function main() {
  clear()
  randomBanner('Skypager')
  print(`Starting MDX Site`)

  runtime.servers.register('app', () => require('../src/server'))

  const server = runtime.server('app', {
    port: runtime.argv.port || process.env.PORT || 5000,
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

main().catch(error => {
  console.error(error)
  process.exit(1)
})
