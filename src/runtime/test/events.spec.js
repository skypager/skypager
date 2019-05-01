import { Runtime, events } from 'runtime'

const sinon = global.sinon

describe('runtime instance event emitter', function() {
  const runtime = new Runtime()
  it('fixes qbus once bug where multiple once listeners could not co-exist', function() {
    const s1 = sinon.spy()
    const s2 = sinon.spy()

    runtime.once('yoyo', s1)
    runtime.once('yoyo', s2)

    runtime.emit('yoyo')

    s1.should.have.been.called
    s2.should.have.been.called
  })

  it('has normal on off', function() {
    const s1 = sinon.spy()

    runtime.on('hi', s1)
    runtime.trigger('hi', 'eugene debs')
    runtime.trigger('hi', 'fred hampton')
    runtime.off('hi', s1)
    runtime.trigger('hi', 'bernie')

    s1.should.have.been.calledWith('eugene debs')
    s1.should.have.been.calledWith('fred hampton')
    s1.should.not.have.been.calledWith('bernie')
  })

  it('supports once still', function() {
    const s1 = sinon.spy()
    runtime.once('hi', s1)
    runtime.emit('hi', 'omar')
    runtime.emit('hi', 'aoc')
    s1.should.have.been.calledOnceWith('omar')
    s1.should.not.have.been.calledWith('aoc')
  })

  it('can listen for route patterns', function() {
    const s1 = sinon.spy()
    runtime.once('/yoyo/:person', s1)
    runtime.emit('/yoyo/bob', 'how you doin')
    s1.should.have.been.calledWith('bob', 'how you doin')
  })
})

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
