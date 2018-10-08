mocha.setup('bdd')
mocha.setup({ timeout: 30000 })
chai.should() // eslint-disable-line

const { skypager } = global

describe('Skypager Runtime', function() {
  it('is available on global', function() {
    window.skypager.should.be.an('object')
  })

  it('knows it is in the browser', function() {
    skypager.isBrowser.should.equal(true)
    skypager.isNode.should.equal(false)
    skypager.isReactNative.should.equal(false)
    skypager.isElectron.should.equal(false)
    skypager.isElectronRenderer.should.equal(false)
  })

  it('has additional web specific features available', function() {
    skypager.features.available.should.include('asset-loaders')
    skypager.features.available.should.include('babel')
  })

  it('comes with the client helper enabled', function() {
    skypager.should.have
      .property('clients')
      .that.is.an('object')
      .that.has.property('register')
      .that.is.a('function')

    skypager.should.have.property('client').that.is.a('function')
  })

  describe('The Asset Loader', function() {
    it('is enabled by default', function() {
      skypager.should.have.property('assetLoader')
    })

    it('loads css', async function() {
      document.querySelectorAll('link').should.have.property('length', 1)
      await skypager.assetLoader.stylesheet('/fixtures/test.css')
      document.querySelectorAll('link').should.have.property('length', 2)
    })

    it('loads scripts', async function() {
      skypager.should.not.have.property('testScriptLoaded')
      await skypager.assetLoader.script('/fixtures/test.js')
      skypager.should.have.property('testScriptLoaded', true)
    })

    /*
    it('loads es6 scripts if the babel feature is enabled', async function() {
      let failed = false

      skypager.feature('babel').enable()
      console.log('Waiting for babel to be ready')
      await skypager.feature('babel').whenReady()
      console.log('babel is ready')

      try {
        console.log('loading test es6 script')
        await skypager.assetLoader.script('/fixtures/test.es6.js', { babel: true })
        console.log('finished?')
      } catch (error) {
        failed = true
      }

      failed.should.equal(true)
    })
    */
  })
})

mocha.run()
