const runtime = require('@skypager/node').use(require('@skypager/helpers-document'))
const bodyParser = require('body-parser')
const mdx = require('./endpoints/mdx')
const babel = require('./endpoints/babel')

const AppServer = {
  cors: true,
  pretty: true,
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
  const port = await runtime.networking.findOpenPort(3000)

  const server = runtime.server('app', {
    port,
    endpoints: ['babel', 'mdx'],
    showBanner: false,
  })

  await server.start()

  console.log(`Server is listening on http://localhost:${server.port}`)
}

main()
