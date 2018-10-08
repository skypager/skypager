const runtime = require('@skypager/node')

async function main() {
  const { _ } = skypager.argv

  if (typeof _[0] === 'string' && runtime.fsx.existsSync(runtime.resolve(_[0]))) {
    runtime.servers.register('static-server', () => ({
      serveStatic: runtime.resolve(_[0]),
      cors: true,
      history: runtime.resolve(_[0], 'index.html'),
    }))
  } else {
    runtime.servers.register('static-server', () => ({
      serveStatic: true,
      cors: true,
      history: true,
    }))
  }

  const server = runtime.server('static-server')

  await server.start()
}

main()
