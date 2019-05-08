const runtime = require('@skypager/node').use(require('..'))
const bodyParser = require('body-parser')

const AppServer = {
  appWillMount(app) {
    app.use(bodyParser.json())
    app.post('/vm', async (req, res) => {
      const { content, name } = req.body
      const script = runtime.script(name, {
        name,
        content,
      })

      await script.parse()
      const instructions = await script.createVMInstructions({ transpile: !!req.body.transpile })

      res.status(200).json({
        instructions,
        content,
        name,
      })
    })
  },
}

runtime.servers.add({
  app: AppServer,
})

async function main() {
  const server = runtime.server('app', {
    port: 3000,
  })

  await server.start()
}

main()
