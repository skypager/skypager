const runtime = require('@skypager/node').use(require('@skypager/helpers-document'))
const bodyParser = require('body-parser')
const mdx = require('./endpoints/mdx')
const babel = require('./endpoints/babel')

const AppServer = {
  cors: true,
  pretty: true,
  serveStatic: 'lib',
  history: true,
  appWillMount(app) {
    app.use(bodyParser.json())
  },
}

runtime.servers.add({
  app: AppServer,
})

runtime.endpoints.add({
  babel,
  mdx,
})

async function main() {
  if (runtime.argv.buildDocHelper) {
    await runtime.proc.async.spawn('yarn', ['build:web', '--include-unminified'], {
      cwd: runtime.resolve('..', '..', 'helpers', 'document'),
      stdio: 'inherit'
    })
    await runtime.proc.async.spawn('skypager', ['hash-build'], {
      cwd: runtime.resolve('..', '..', 'helpers', 'document'),
      stdio: 'inherit'
    })   
  }

  if (runtime.argv.buildDocHelper) {
    await runtime.proc.async.spawn('yarn', ['build:app'], {
      stdio: 'inherit'
    })
    await runtime.proc.async.spawn('skypager', ['hash-build'], {
      stdio: 'inherit'
    })      
  } 

  const port = await runtime.networking.findOpenPort(3000)

  const server = runtime.server('app', {
    port,
    history: {
      htmlFile: 'index.html',
      root: runtime.resolve('lib'),
    },
    endpoints: ['babel', 'mdx'],
    showBanner: false,
  })

  await server.start()

  console.log(`Server is listening on http://localhost:${server.port}`)

  if (runtime.argv.open) {
    await runtime.opener.openInBrowser(`http://localhost:${server.port}`)
  }
}

main()
