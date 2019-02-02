describe('The Skywalker Feature', function() {
  const runtime = require('../../src/index.js')

  it('is available', function() {
    runtime.features.checkKey('skywalker').should.equal('skywalker')
  })

  it('is defined as a class', function() {
    runtime.feature('skywalker').provider.should.have.property('default')
  })

  it('gets created as an instance of the SkywalkerFeature class', function() {
    runtime.feature('skywalker').constructor.name.should.equal('SkywalkerFeature')
  })

  it('can be created on the runtime', function() {
    runtime.skywalker.should.be.an.instanceOf(runtime.Feature)
  })

  it('lets you walk a file tree the slow way', function() {
    runtime.skywalker.should.have.property('walk').that.is.a('function')
  })
})
