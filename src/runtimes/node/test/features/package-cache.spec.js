describe('The Package Cache Feature', function() {
  const runtime = require('../../src/index.js')

  it('is available', function() {
    runtime.features.checkKey('package-cache').should.equal('package-cache')
  })

  it('is defined as a class', function() {
    runtime.feature('package-cache').provider.should.have.property('default')
  })

  it('gets created as an instance of the PackageCacheFeature class', function() {
    runtime.feature('package-cache').constructor.name.should.equal('PackageCacheFeature')
  })
})
