describe('The Networking Adapter', function() {
  const runtime = require('../../src/index')
  const { networking } = runtime

  it('is available on the runtime', function() {
    runtime.should.have.property('networking')
  })

  it('has a method for finding an open port', async function() {
    const openPort = await networking.findOpenPort()
    openPort.should.be.a('number')
  })

  it('has a method for checking if a port is open', async function() {
    const openPort = await networking.findOpenPort()
    const isOpen = await networking.isPortOpen(openPort)
    isOpen.should.equal(true)
  })
})
