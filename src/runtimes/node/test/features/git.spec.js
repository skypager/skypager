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
})
