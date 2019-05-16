import { Runtime } from '../src/runtime'

describe('@skypager/runtime', function() {
  it('can create runtime instances using a Runtime class', function() {
    const runtimeOne = new Runtime()
    const runtimeTwo = new Runtime()

    runtimeOne.uuid.should.not.equal(runtimeTwo.uuid)
  })

  it('creates a singleton runtime instance', function() {
    const runtime = Runtime.createSingleton()
    const alt = Runtime.createSingleton()
    runtime.should.be.an('object')
    runtime.uuid.should.equal(alt.uuid)
  })

  it('has a vm', function() {
    const runtime = Runtime.createSingleton()
    runtime.should.have.property('vm')
  })

  describe('extending the runtime with plugins', function() {
    const runtime = Runtime.createSingleton()

    it('can be extended', function() {
      runtime.should.have.property('use').that.is.a('function')
    })

    it('can be extended immediately with an attach function', function() {
      runtime.use({
        attach() {
          runtime.attachWorked = true
        },
      })

      runtime.should.have.property('attachWorked', true)
    })

    it('can defer extensions until the runtime is started', async function() {
      let notCalled = true
      const runtime = new Runtime()
      runtime.use(next => {
        notCalled = false
        runtime.extensionRan = true
        next()
      })
      notCalled.should.equal(true)
    })
  })
})
