import axios from 'axios'
import { runtime } from './runtime'

describe('Servers', function() {
  it('registers the package manager endpoints server if the server helper is in use', function() {
    runtime.should.have
      .property('endpoints')
      .that.has.property('available')
      .that.is.an('array')
      .that.includes('package-manager')
  })

  let server

  const get = url => {
    const { port, hostname } = server
    return axios.get(`http://${hostname}:${port}/${url.replace(/^\//, '')}`).then(r => r.data)
  }

  it('provides a REST API', async function() {
    const openPort = await runtime.networking.findOpenPort()

    server = runtime.server('package-manager', {
      port: openPort,
      hostname: 'localhost',
      showBanner: false,
    })

    await server.start()

    const result = await runtime.networking.isPortOpen(openPort)
    result.should.not.equal(openPort)
  })

  it('provides access to the package manager', async function() {
    const response = await get('/api/package-manager')
    response.should.be
      .an('object')
      .that.has.property('packageIds')
      .that.is.an('array')
      .that.includes('@skypager/features-package-manager')
    response.should.be
      .an('object')
      .that.has.property('versions')
      .that.has.property('test-package', '0.0.1')
  })

  it('provides info about all the packages', async function() {
    const response = await get('/api/package-manager/packages')
    response.should.be.an('array')
    const names = response.map(p => p.name)
    names.should.include('@skypager/features-package-manager')
    names.should.include('test-package')
    names.should.include('test-package-2')
  })

  it('provides access to package info', async function() {
    const response = await get('/api/package-manager/package/@skypager/features-package-manager')
    response.should.be.an('object').that.has.property('name', '@skypager/features-package-manager')
    await server.stop()
  })
})
