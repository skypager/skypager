import runtime, { Helper } from '../src'
import { spy } from 'sinon'

describe('Helper Events', function() {
  it('can wait for helpers to be attached to the runtime', function() {
    const reg = spy()

    runtime.onRegistration('ballers', reg)
    reg.should.not.have.been.called

    class Baller extends Helper {}

    runtime.use(Baller)
    reg.should.have.been.called
  })

  it('emits events when a helper is created', function() {
    const create = spy()
    runtime.on('helperWasCreated', create)
    runtime.features.register('helper-event', () => ({}))

    const e = runtime.feature('helper-event')

    create.should.have.been.called
  })

  it('calls beforeInitialize, afterInitialize hooks', async function() {
    const before = spy()
    const after = spy()
    const init = spy()

    class Hooker extends Helper {
      beforeInitialize() {
        before()
        this.setState({ before: 'yes' })
      }

      afterInitialize() {
        after()
        this.setState({ after: 'yes' })
      }
    }

    runtime.use(Hooker)
    runtime.hookers.register('yoyo', () => ({}))
    runtime.on('helperWasInitialized', init)

    const h = await runtime.hooker('yoyo')

    before.should.have.been.called
    h.currentState.before.should.equal('yes')

    after.should.have.been.called
    h.currentState.after.should.equal('yes')
    init.should.have.been.called
  })
})
