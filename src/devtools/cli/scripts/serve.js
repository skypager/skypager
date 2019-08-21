const runtime = require('@skypager/node')

async function main() {
  const requestedHelp = runtime.argv.help || runtime.argv._[0] === 'help'

  if (requestedHelp) {
    displayHelp()
  } else {
    return handler()
  }
}

function displayHelp() {
  const { colors, randomBanner, print } = runtime.cli

  randomBanner('Skypager')
  print(colors.bold.underline(`Skypager Server`), 0, 0, 1)
  console.log(
    `
    Starts a @skypager/helpers-server based server module.

    ${colors.bold.underline('Examples')}:

    Provide the path to the server helper module definition:

      $ skypager serve server/index.js
    
    Provide a directory to serve as a static file server with html history fallback

      $ skypager serve build/

    ${colors.bold.underline('Options')}:
      --esm                   enable es module import/export syntax
      --babel                 enable @babel/register on the fly module transpilation
      --port <port>           the port number to listen on, defaults to 3000
      --host <hostname>       the interface to bind to (e.g. localhost, 0.0.0.0) defaults to 0.0.0.0   
      --enable-logging        enable winston request logging
      --build-folder <path>   which file to serve static files from
      --no-cors               disable CORS support
      --no-history            disable html history fallback
      --no-single             same as --no-history
      --no-show-banner        disable the automatic info banner
    `.trim()
  )
}

async function handler() {
  const { _ } = runtime.argv
  const request = _[0]

  let server = runtime.argv.server
  let serverInstance

  let port = parseInt(runtime.argv.port || process.env.PORT || process.env.SERVER_PORT || 3000, 10)
  const hostname =
    runtime.argv.host ||
    runtime.argv.hostname ||
    process.env.HOST ||
    process.env.SERVER_HOST ||
    '0.0.0.0'

  const isPortOpen = await runtime.networking.isPortOpen(port)

  if (!isPortOpen && !runtime.isProduction && !runtime.isTest) {
    port = await runtime.networking.findOpenPort(port)
  }

  if (request && request.length) {
    const requestPath = runtime.resolve(request)
    const fileExists = await runtime.fsx.existsAsync(requestPath)
    const isDirectory = await (fileExists && runtime.fsx.isDirectoryAsync(requestPath))

    if (isDirectory && !server) {
      // we're going to setup a static file server using the provided directory
      serverInstance = createStaticFileServer({ port, hostname, buildFolder: requestPath })
    } else if (!isDirectory && !server && fileExists) {
      // they must have passed a reference to a server file
      serverInstance = createServer(requestPath, { hostname, port })
    }
  } else if (!request && !server) {
    // we're going to setup a static file server using the default build directory
    serverInstance = createStaticFileServer({
      buildFolder: runtime.argv.buildFolder || runtime.resolve('build'),
      hostname,
      port,
    })
  } else if (server) {
    // they passed a reference to a file server
    serverInstance = createServer(server, {
      hostname,
      port,
    })
  }

  await serverInstance.start()

  if (runtime.argv.open) {
    Promise.resolve(
      runtime.opener.openInBrowser(`http://${serverInstance.hostname}:${serverInstance.port}`)
    ).catch(error => error)
  }

  if (runtime.argv.interactive) {
    runtime.repl('interactive').launch({ runtime, server: serverInstance, l: runtime.lodash })
  }
}

function createServer(helperPath, options = {}) {
  runtime.servers.register('server', () => require(runtime.resolve(helperPath)))
  return runtime.server('server', options)
}

function createStaticFileServer({ buildFolder = runtime.resolve('build'), ...options }) {
  runtime.servers.register('static-server', () => ({
    history: runtime.argv.history !== false && runtime.argv.single !== false,
    serveStatic: buildFolder,
    cors: runtime.argv.cors !== false,
  }))

  return runtime.server('static-server', options)
}

main()
