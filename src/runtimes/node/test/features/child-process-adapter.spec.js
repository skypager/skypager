describe('The Child Process Adapter', function() {
  const runtime = require('../../src/index.js')

  it('provides the node child_process functions', function() {
    runtime.should.have.property('proc')

    runtime.proc.should.have.property('exec').that.is.a('function')
    runtime.proc.should.have.property('execSync').that.is.a('function')
    runtime.proc.should.have.property('spawn').that.is.a('function')
    runtime.proc.should.have.property('spawnSync').that.is.a('function')
    runtime.proc.should.have.property('fork').that.is.a('function')
  })

  it('provides an async wrapper around the node child_process functions', function() {
    runtime.should.have
      .property('proc')
      .that.has.property('async')
      .that.is.an('object')

    runtime.proc.async.should.have.property('exec').that.is.a('function')
    runtime.proc.async.should.have.property('spawn').that.is.a('function')
    runtime.proc.async.should.have.property('fork').that.is.a('function')
  })
})
