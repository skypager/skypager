describe('The Main Script Feature', function() {
  const runtime = require('../../src/index.js')

  it('is available', function() {
    runtime.features.checkKey('main-script').should.equal('main-script')
  })

  it('is defined as a class', function() {
    runtime.feature('main-script').provider.should.have.property('default')
  })

  it('gets created as an instance of the MainScriptFeature class', function() {
    runtime.feature('main-script').constructor.name.should.equal('MainScriptFeature')
  })

  it('tells us the main script path', function() {
    runtime.feature('main-script').skypagerMainPath.should.equal(runtime.resolve('skypager.js'))
  })

  it('tells us if the main script exists', function() {
    runtime.feature('main-script').mainScriptExists.should.equal(false)
  })
})
