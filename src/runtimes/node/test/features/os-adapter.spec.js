describe('The OS Adapter', function() {
  const runtime = require('../../src/index')
  const { os } = runtime

  it('tells us information about the architecture and platform', function() {
    os.should.have.property('arch').that.is.a('string')
    os.should.have.property('platform').that.is.a('string')
  })

  it('tells us about uptime', function() {
    os.should.have.property('uptime')
  })

  it('tells us about the cpu', function() {
    os.should.have.property('cpuCount').that.is.a('number')
  })

  it('tells us about the mac addresses', function() {
    os.should.have.property('macAddresses').that.is.an('array').that.is.not.empty
  })
})
