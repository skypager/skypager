describe('node runtime helpers', function() {
  const runtime = require('../../src/index.js')
  it('should include the repl helper', function() {
    runtime.should.have
      .property('repls')
      .that.is.an('object')
      .that.has.property('lookup')
      .that.is.a('function')
    runtime.should.have.property('repl').that.is.a('function')
  })
  it('should include the client helper', function() {
    runtime.should.have
      .property('clients')
      .that.is.an('object')
      .that.has.property('lookup')
      .that.is.a('function')
    runtime.should.have.property('client').that.is.a('function')
  })
  it('should include the server helper', function() {
    runtime.should.have.property('server').that.is.a('function')
    runtime.should.have
      .property('servers')
      .that.is.an('object')
      .that.has.property('lookup')
      .that.is.a('function')
  })
  it('should include the file manager feature', async function() {
    runtime.should.have
      .property('fileManager')
      .that.is.an('object')
      .that.has.property('startAsync')
      .that.is.a('function')

    await runtime.fileManager.startAsync()

    runtime.fileManager.should.have.property('status', 'READY')
    runtime.fileManager.should.have.property('fileIds').that.includes('src/index.js')
  })
  it('should include the package manager feature', async function() {
    runtime.should.have
      .property('packageManager')
      .that.is.an('object')
      .that.has.property('startAsync')
      .that.is.a('function')

    await runtime.packageManager.startAsync()

    debugger // eslint-disable-line

    runtime.packageManager.should.have.property('status', 'READY')
    runtime.packageManager.should.have.property('manifests')
    runtime.packageManager.should.have.property('packageIds').that.is.an('array').that.is.not.empty
    runtime.packageManager.byName.should.be.an('object').that.has.property('@skypager/node')
    runtime.packageManager.byName['@skypager/node'].should.have.property('_file').that.is.not.empty
  })
  it('should include the module manager feature', async function() {
    runtime.should.have
      .property('moduleManager')
      .that.is.an('object')
      .that.has.property('startAsync')
      .that.is.a('function')
    await runtime.moduleManager.startAsync()
    runtime.moduleManager.should.have.property('status', 'READY')
  })
})
