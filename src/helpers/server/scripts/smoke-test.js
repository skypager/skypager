const runtime = require('@skypager/node')
  .use(require('@skypager/helpers-server'))
  .use(require('@skypager/helpers-client'))

const { print, colors } = runtime.cli

runtime.servers.register('app', () => ({
  appWillMount(app) {
    app.get('/api', (req, res) => res.json([{ one: 1, two: 2 }]))
    return app
  },
}))

runtime.clients.register('app', () => ({
  methods: ['list'],
  async list() {
    return this.client.get(`${this.options.baseURL}/api`).then(r => r.data)
  },
}))

async function main() {
  const port = await runtime.networking.findOpenPort()
  console.log()
  print(`Available Servers:`)
  print(runtime.servers.available, 4)
  print(`Available Clients:`)
  print(runtime.clients.available, 4)
  console.log()
  await runtime
    .server('app', {
      port,
      hostname: 'localhost',
    })
    .start()

  const data = await runtime
    .client('app', {
      baseURL: `http://localhost:${port}`,
    })
    .list()

  if (data[0] && data[0].one === 1) {
    print(colors.green('SUCCESS'))
    process.exit(0)
  } else {
    print(colors.red('FAILURE'))
    print(`Server failed to return data`)
    process.exit(1)
  }
}

main().catch(error => {
  print(colors.red('ERROR'))
  print(error.message)
  print(error.stack, 8)
})
