import runtime from './runtime'

describe('The File Manager Feature', function() {
  it('gets registered in the runtime', function() {
    runtime.features.available.should.contain('file-manager')
  })

  it('gets enabled automatically once used', function() {
    runtime.isFeatureEnabled('file-manager').should.equal(true)
    runtime.has('fileManager').should.equal(true)
  })

  it('starts off without any knowledge of files or directories', function() {
    runtime.should.have.property('fileIds').that.is.empty
    runtime.should.have.property('directoryIds').that.is.empty
  })

  it('can be started', async function() {
    await runtime.fileManager.startAsync()
    runtime.fileManager.should.have.property('status', 'READY')
  })

  it('has file and directory data after it is started', function() {
    runtime.fileManager.should.have.property('status', 'READY')
    runtime.fileManager.fileIds.should.be.an('array').that.is.not.empty
    runtime.fileManager.directoryIds.should.be.an('array').that.is.not.empty
  })

  it('can match files using a route pattern', function() {
    const matches = runtime.fileManager.matchRoute('src/:name.js')
    matches.should.be.an('array').that.is.not.empty
    matches[0].should.be
      .an('object')
      .with.property('result')
      .that.is.an('object')
      .that.has.property('name').that.is.not.empty
  })

  it('is based on the underlying git feature of the node runtime', function() {
    runtime.fileManager.directoryIds.length.should.equal(runtime.git.directoryIds.length)
    runtime.fileManager.fileIds.length.should.equal(runtime.git.fileIds.length)
  })

  it('has functions for accessing files', function() {
    runtime.fileManager.featureMethods.should.include('file')
    runtime.fileManager.provider.should.have.property('file').that.is.a('function')
    // runtime.feature('file-manager').should.have.property('file').that.is.a('function')
  })
})
