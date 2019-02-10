import { Runtime, events } from 'runtime'

const sinon = global.sinon

describe('Runtime.events', function() {
  it('emits events on a global event bus shared by all runtimes', function() {
    const runtimeWasCreated = sinon.spy()
    const runtimeWasInitialized = sinon.spy()
    const runtimeIsStarting = sinon.spy()
    const runtimeDidStart = sinon.spy()

    events.on('runtimeWasCreated', runtimeWasCreated)
    events.on('runtimeWasInitialized', runtimeWasInitialized)
    events.on('runtimeIsStarting', runtimeIsStarting)
    events.on('runtimeDidStart', runtimeDidStart)

    const runtime = new Runtime()

    it('emits runtimeWasCreated', function() {
      runtimeWasCreated.should.have.been.called
    })

    it('emits runtimeWasInitialized', function() {
      runtimeWasCreated.should.have.been.called
    })

    it('emits runtimeIsStarting and runtimeDidStart', async function() {
      runtimeIsStarting.should.not.have.been.called
      await runtime.start()
      runtimeIsStarting.should.have.been.called
      runtimeDidStart.should.have.been.called
    })

    it('emits events when runtimes fail to start', function() {
      const failSpy = sinon.spy()
      const doomed = new Runtime()
      doomed.use(next => {
        next(new Error('was never gonna happen'))
      })

      events.once('runtimeFailedStart', failSpy)

      runtime.once('runtimeFailedStart', failSpy)

      failSpy.should.not.have.been.called

      runtime.start().catch(error => error)

      failSpy.should.have.been.called.twice
    })
  })
})
