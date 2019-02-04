const runtime = require('@skypager/node')

async function main() {
  const { _ } = runtime.argv
  const request = _[0]

  let server = runtime.argv.server
  let serverInstance

  if (request && request.length) {
    const requestPath = runtime.resolve(request)
    const fileExists = await runtime.fsx.existsAsync(requestPath)
    const isDirectory = await (fileExists && runtime.fsx.isDirectoryAsync(requestPath))

    if (isDirectory && !server) {
      // we're going to setup a static file server using the provided directory
      serverInstance = createStaticFileServer({ buildFolder: requestPath })
    } else if (!isDirectory && !server && fileExists) {
      // they must have passed a reference to a server file
      serverInstance = createServer(requestPath)
    }
  } else if (!request && !server) {
    // we're going to setup a static file server using the default build directory
    serverInstance = createStaticFileServer({
      buildFolder: runtime.argv.buildFolder || runtime.resolve('build'),
    })
  } else if (server) {
    // they passed a reference to a file server
    serverInstance = createServer(server)
  }

  await serverInstance.start()

  if (runtime.argv.open) {
    Promise.resolve(
      runtime.opener.openInBrowser(`http://${serverInstance.hostname}:${serverInstance.port}`)
    ).catch(error => error)
  }

  if (runtime.argv.interactive) {
    runtime.repl('interactive').launch({ server: serverInstance })
  }
}

function createServer(helperPath) {
  runtime.servers.register('server', () => require(runtime.resolve(helperPath)))
  return runtime.server('server')
}

function createStaticFileServer({ buildFolder = runtime.resolve('build') }) {
  runtime.servers.register('static-server', () => ({
    history: runtime.argv.history !== false && runtime.argv.single !== false,
    serveStatic: buildFolder,
    cors: runtime.argv.cors !== false,
  }))

  return runtime.server('static-server')
}

main()
