import { Runtime } from 'runtime'

const sinon = global.sinon

describe('Extension Middlewares', function() {
  it('goes through several stages', async function() {
    const stages = []

    const runtime = new Runtime({ name: 'middleareFunctionTest' }, function() {
      const instance = this
      instance.on('stageDidChangeState', ({ oldValue = 'CREATED', newValue }) => {
        stages.push(`${oldValue}:${newValue}`)
      })
    })

    await runtime.start()

    stages.length.should.equal(6)
    stages
      .join(' ')
      .should.equal(
        [
          'CREATED:INITIALIZING',
          'INITIALIZING:INITIALIZED',
          'INITIALIZED:PREPARING',
          'PREPARING:STARTING',
          'STARTING:READY',
          'READY:RUNNING',
        ].join(' ')
      )
  })

  it('runs any middlewares assigned to the INITIALIZING stage right away', function() {
    const runtime = new Runtime()
    runtime.use(next => {
      runtime.setState({ counter: 0 })
      next()
    }, 'INITIALIZING')
    runtime.currentState.counter.should.equal(0)
  })

  it('does not run a middleware immediately', function() {
    const runtime = new Runtime()
    runtime.setState({ counter: 0 })

    runtime.use(next => {
      runtime.setState({ counter: 1 })
      next()
    })

    runtime.currentState.counter.should.equal(0)
    runtime.start()
    runtime.currentState.counter.should.equal(1)
  })

  it('can be extended with asynchronous middlewares', async function() {
    const runtime = new Runtime()
    const spy = sinon.spy()

    runtime.setState({ counter: 0 })

    runtime
      .use(next => {
        runtime.setState(({ counter }) => ({ counter: counter + 1 }))
        setTimeout(() => {
          runtime.setState(({ counter }) => ({ counter: counter + 1 }))
          next()
        }, 300)
      })
      .use(next => {
        runtime.currentState.counter.should.equal(2)
        runtime.setState(
          ({ counter }) => ({ counter: counter + 1 }),
          () => {
            spy()
            next()
          }
        )
      })

    spy.should.not.have.been.called
    await runtime.start()
    runtime.currentState.counter.should.equal(3)
    spy.should.have.been.called
  })
})
