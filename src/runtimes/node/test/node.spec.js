describe('@skypager/node', function() {
  const runtime = require('../src/index.js')

  before(async function() {
    await runtime.start()
  })

  it('knows the command line arguments', function() {
    runtime.argv.should.be
      .an('object')
      .with.property('_')
      .that.is.an('array')

    runtime.should.have.property('parseArgv')
  })

  it('has access to command line interface helpers', function() {
    runtime.should.have.property('cli').that.is.an('object')

    runtime.cli.should.have.property('colors').that.is.an('object')
    runtime.cli.should.have.property('randomBanner').that.is.a('function')
    runtime.cli.should.have.property('print').that.is.a('function')
    runtime.cli.should.have.property('clear').that.is.a('function')
    runtime.cli.should.have.property('icon').that.is.a('function')
  })
})
