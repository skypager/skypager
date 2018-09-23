describe('The Git Adapter', function() {
  const runtime = require('../../src/index.js')
  const { git } = runtime

  before(async function() {
    await git.walk()
  })

  it('provides generic info about the git status', function() {
    runtime.should.have
      .property('gitInfo')
      .that.is.an('object')
      .that.has.property('sha')
      .that.is.a('string')
  })

  it('provides information about the current files in git', function() {
    git.should.have
      .property('fileIds')
      .that.is.an('array')
      .that.includes('src/index.js')
  })

  it('creates files and directory getters on runtime', function() {
    runtime.should.have.property('files')
    runtime.should.have.property('directories')
    runtime.should.have.property('fileObjects')
    runtime.should.have.property('directoryObjects')
    runtime.files.keys().should.not.be.empty
    runtime.directories.keys().should.not.be.empty
  })
})
