import axios from 'axios'
import { runtime } from './runtime'

describe('Servers', function() {
  it('registers the file manager endpoints server if the server helper is in use', function() {
    runtime.should.have
      .property('endpoints')
      .that.has.property('available')
      .that.is.an('array')
      .that.includes('file-manager')
  })

  let server
  it('provides a REST API', async function() {
    const openPort = await runtime.networking.findOpenPort()

    server = runtime.server('file-manager', {
      port: openPort,
      hostname: 'localhost',
      showBanner: false,
    })

    await server.start()

    const result = await runtime.networking.isPortOpen(openPort)
    result.should.not.equal(openPort)
  })

  after(function() {
    server.stop()
  })

  const get = url => {
    const { port, hostname } = server
    return axios.get(`http://${hostname}:${port}/${url.replace(/^\//, '')}`).then(r => r.data)
  }

  it('provides access to the in memory file system', async function() {
    const response = await get('/api/file-manager')

    response.should.be
      .an('object')
      .that.has.property('fileIds')
      .that.includes('src/index.js')

    response.should.be
      .an('object')
      .that.has.property('directoryIds')
      .that.includes('src')
  })

  it('provides info about a directory', async function() {
    const response = await get('/api/file-manager/src')
    response.should.be.an('object').that.is.not.empty
    // don't expose info about the real path
    response.path.should.not.include(runtime.cwd)
    response.dir.should.be.a('string').that.matches(/src$/)
    response.should.have.property('children').that.is.not.empty
    response.children.should.have.property('files').that.is.not.empty
    response.children.should.have.property('directories').that.is.not.empty
  })

  it('provides info about a file', async function() {
    const response = await get('/api/file-manager/src/index.js')
    response.should.be.an('object')
    // don't expost real path info
    response.path.should.be.a('string').that.does.not.include(runtime.cwd)
    response.dir.should.be.a('string').that.does.not.include(runtime.cwd)

    response.should.have.property('content').that.is.not.empty
    response.should.have.property('hash').that.is.not.empty
  })
})
