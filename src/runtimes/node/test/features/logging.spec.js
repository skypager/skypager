describe('The Logging Adapter', function() {
  const runtime = require('../../src/index.js')

  before(async () => runtime.start())

  it('should provide a logger on the runtime', function() {
    runtime.should.have.property('logger')
  })

  it('should provide a standard logger interface', function() {
    ;['info', 'warn', 'debug', 'error', 'log'].forEach(fn => {
      runtime.should.have.property(fn).that.is.a('function')
      runtime.logger.should.have.property(fn).that.is.a('function')
    })
  })

  it('provides an interface for working with logging', function() {
    runtime.should.have.property('logging')
    runtime.logging.should.have.property('enableConsoleOutput').that.is.a('function')
  })

  it('should proxy on top of winston', function() {
    runtime.should.have.property('loggers')
    runtime.loggers.should.have.property('transports').that.is.an('object')
    runtime.loggers.should.have.property('add').that.a.a('function')
    runtime.loggers.should.have.property('remove').that.a.a('function')
  })
})
