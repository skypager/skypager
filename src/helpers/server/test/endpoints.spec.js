import runtime from '@skypager/node'
import * as ServerHelper from '../src'

describe('Server Endpoints', function() {
  let server

  before(async function() {
    runtime.use(ServerHelper)
    runtime.endpoints.register(
      'test-endpoint',
      () =>
        function(app, options, context) {
          app.use('/test-endpoint', (req, res) => res.json({ testEndpointWorks: true }))
        }
    )

    runtime.servers.register('test', () => ({
      endpoints: ['test-endpoint'],
    }))

    const port = await runtime.networking.findOpenPort()

    server = runtime.server('test', {
      hostname: 'localhost',
      port,
    })

    await server.start()
  })

  it('creates a registry for endpoints', function() {
    runtime.should.have
      .property('endpoints')
      .that.is.an('object')
      .that.has.property('register')
      .that.is.a('function')
  })
  it('can add any endpoints found in the endpoints registry', async function() {
    const axios = require('axios')
    const response = await axios
      .get(`http://${server.hostname}:${server.port}/test-endpoint`)
      .then(r => r.data)
    response.should.have.property('testEndpointWorks', true)
  })
})
