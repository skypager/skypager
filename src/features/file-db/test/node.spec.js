describe('@skypager/features-browser-vm', function() {
  const runtime = require('@skypager/node')
  const { default: defaultExports, attach } = require('../src')

  it('exports a class', function() {
    defaultExports.should.have.property('isSkypagerHelper')
  })

  it('registers the feature', function() {
    runtime.features.available.should.include('browser-vm')
  })

  it('can be used to automatically enable', function() {
    runtime.use({ attach })
    runtime.should.have.property('browserVm')
  })

  it('runs browser code', function() {
    const { result } = runtime.browserVm.runScript('window.bang = { jon: 1 }')
    const jon = typeof result.jon
    jon.should.equal('number')
  })

  it('retains the global context', function() {
    const { context } = runtime.browserVm.runScript('window.bang = { jon: 1 }')
    const bang = typeof context.bang
    bang.should.equal('object')
  })
})
