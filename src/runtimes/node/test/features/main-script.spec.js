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

  describe('main script auto loading', function() {
    it('can load the module with global context and tap into the start sequence', async function() {
      const test = runtime.spawn({ cwd: runtime.resolve('test', 'fixtures', 'main-script') })
      test.use('runtimes/node')

      const start = test.mainScript.mainExports.start
      ;(typeof start).should.equal('function')

      await test.mainScript.whenReady()

      test.currentState.should.have.property('attachMainScript', true)
      test.currentState.should.have.property('mainScriptSideEffects', true)

      test.stage.should.equal('READY')

      await test.start()

      const val = test.state.get('startHookFinished') || false
      val.should.equal(true)

      test.stage.should.equal('RUNNING')
    })
  })
})
