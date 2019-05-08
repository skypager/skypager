const runtime = require('@skypager/node').use(require('@skypager/helpers-document'))
const bodyParser = require('body-parser')

const AppServer = {
  cors: true,
  pretty: true,
  appWillMount(app) {
    app.use(bodyParser.json())
    app.post('/vm', async (req, res) => {
      const { content, name } = req.body
      const script = runtime.script(name, {
        name: String(name),
        content: String(content),
      })

      try {
        await script.parse()
      } catch (error) {
        this.runtime.error('Error parsing script', error)
        res
          .status(500)
          .json({ error: 'Error parsing script', message: error.message, stack: error.stack })
        return
      }

      try {
        const instructions = await script.createVMInstructions({ transpile: !!req.body.transpile })

        res.status(200).json({
          instructions,
          content,
          name,
          script: script.provider,
        })
      } catch (error) {
        this.runtime.error('Error generating VM Instructions', error)
        res.status(500).json({ error: 'Error generating VM Instructions', message: error.message })
      }
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
