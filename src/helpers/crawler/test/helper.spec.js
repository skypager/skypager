import runtime from '@skypager/node'
import * as ServerHelper from '../src'

describe('The Server Helper', function() {
  before(function() {
    runtime.use(ServerHelper)
  })

  it('registers as a helper', function() {
    runtime.helpers.available.should.include('server')
  })

  it('attachs a servers registry to the runtime', function() {
    runtime.should.have
      .property('servers')
      .that.is.an('object')
      .that.has.property('available')
      .that.is.an('array')
  })

  it('attaches a factory function for creating server helper instances', function() {
    runtime.should.have.property('server').that.is.a('function')
  })
})
