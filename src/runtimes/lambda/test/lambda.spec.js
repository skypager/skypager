import runtime from '../src'

describe('lambda runtime', function() {
  it('has some node features', function() {
    runtime.features.checkKey('fs-adapter').should.equal('fs-adapter')
    runtime.features.checkKey('child-process-adapter').should.equal('child-process-adapter')
    runtime.features.checkKey('script-runner').should.equal('script-runner')
    runtime.features.checkKey('runtimes/lambda').should.equal('runtimes/lambda')
  })

  it('finds the currentPackage', function() {
    runtime.should.have
      .property('currentPackage')
      .that.is.an('object')
      .that.has.property('name', '@skypager/lambda')
  })

  it('has the client helper', function() {
    runtime.should.have.property('client').that.is.a('function')
  })
})
