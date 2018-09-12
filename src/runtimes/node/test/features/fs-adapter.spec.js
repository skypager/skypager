describe('The File System Adapter', function() {
  const runtime = require('../../src/index.js')
  const { fsx } = runtime

  it('provides access to async versions of the fs-extra library', function() {
    fsx.should.have.property('readJsonAsync').that.is.a('function')
    fsx.should.have.property('writeJsonAsync').that.is.a('function')
    fsx.should.have.property('writeFileAsync').that.is.a('function')
    fsx.should.have.property('readFileAsync').that.is.a('function')
    fsx.should.have.property('ensureSymlinkAsync').that.is.a('function')
    fsx.should.have.property('mkdirpAsync').that.is.a('function')
  })
})
