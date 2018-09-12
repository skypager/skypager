describe('The Package Finder', function() {
  const runtime = require('../../src/index')

  it('is available on the runtime', function() {
    runtime.should.have
      .property('packageFinder')
      .which.is.an('object')
      .that.has.property('attemptResolve')
      .that.is.a('function')
  })

  it('will attempt to resolve a package', function() {
    runtime.packageFinder.attemptResolve('not_gon_find_it').should.equal(false)
    runtime.packageFinder.attemptResolve('@skypager/node').should.be.a('string')
  })
})
