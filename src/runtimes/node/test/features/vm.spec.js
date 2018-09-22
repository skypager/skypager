describe('the vm feature', function() {
  const runtime = require('../../src/index.js')

  it('provides the vm interface', function() {
    runtime.should.have.property('vm')
    runtime.vm.should.have.property('createContext').that.is.a('function')
  })
})
