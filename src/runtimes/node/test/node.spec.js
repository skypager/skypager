describe('@skypager/node', function() {
  const runtime = require('../src/index.js')

  before(async function() {
    await runtime.start()
  })

  it('should detect that it is node', function() {
    console.log(typeof process)
    console.log(process.title)
    runtime.should.have.property('isNode', true)
    runtime.should.have.property('isBrowser', false)
    runtime.should.have.property('isReactNative', false)
    runtime.should.have.property('isElectron', false)
  })

  it('knows the command line arguments', function() {
    runtime.argv.should.be
      .an('object')
      .with.property('_')
      .that.is.an('array')

    runtime.should.have.property('parseArgv')
  })

  it('provides access to command line interface helpers', function() {
    runtime.should.have.property('cli').that.is.an('object')

    runtime.cli.should.have.property('colors').that.is.an('object')
    runtime.cli.should.have.property('randomBanner').that.is.a('function')
    runtime.cli.should.have.property('print').that.is.a('function')
    runtime.cli.should.have.property('clear').that.is.a('function')
    runtime.cli.should.have.property('icon').that.is.a('function')
  })

  it('has a reference to the current package manifest', function() {
    runtime.should.have.property('currentPackage').that.is.an('object').that.is.not.empty
    runtime.currentPackage.should.have.property('name', '@skypager/node')
    runtime.currentPackage.should.have.property('main', 'lib/index.js')
  })
})
