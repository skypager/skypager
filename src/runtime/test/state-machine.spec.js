import { Runtime } from '../src/runtime'
const { sinon } = global

describe('@skypager/runtime state machine', function() {
  const runtime = new Runtime()

  it('has an observable state map', function() {
    runtime.should.have.property('state')
  })

  it('has a computed current state', function() {
    runtime.should.have.property('currentState').that.is.an('object')
  })

  it('has a stateVersion number', function() {
    runtime.should.have.property('stateVersion').that.is.a('number')
  })

  it('can await the next state change', async function() {
    runtime.setState({ patientlyWaiting: true })

    setTimeout(() => {
      runtime.setState({ patientlyWaiting: false })
    }, 30)

    runtime.currentState.should.have.property("patientlyWaiting", true)

    await runtime.nextStateChange("patientlyWaiting")

    runtime.currentState.should.have.property("patientlyWaiting", false)
  })

  it('has a hash of the state values', function() {
    runtime.should.have.property('stateHash').that.is.a('string').that.is.not.empty
  })

  it('can setState', function() {
    runtime.setState({
      value1: 'value1',
      value2: 'value2',
    })

    runtime.currentState.value1.should.equal('value1')
    runtime.currentState.value2.should.equal('value2')
  })

  it('can handle a setState function', function() {
    runtime.setState({ originalValue: 1 })
    runtime.setState(currentState => ({
      originalValue: currentState.originalValue + 1,
    }))
    runtime.currentState.originalValue.should.equal(2)
  })

  it('can handle a setState callback with a state function', function() {
    const spy1 = sinon.spy()
    runtime.setState({ originalValue: 1 })
    runtime.setState(
      currentState => ({
        originalValue: currentState.originalValue + 1,
      }),
      spy1
    )

    spy1.should.have.been.called
  })

  it('can handle a setState callback with a state object', function() {
    const spy1 = sinon.spy()
    runtime.setState({ originalValue: 1 })
    runtime.setState({ originalValue: 2 }, spy1)

    spy1.should.have.been.called
  })

  it('can replaceState', function() {
    runtime.replaceState({ value3: 'value3' })

    runtime.currentState.should.not.have.property('value1')
    runtime.currentState.should.have.property('value3', 'value3')
  })

  it('can replaceState with a callback', function() {
    const spy1 = sinon.spy()

    runtime.replaceState({ value3: 'value3' }, spy1)

    runtime.currentState.should.not.have.property('value1')
    runtime.currentState.should.have.property('value3', 'value3')
    spy1.should.have.been.called
  })

  it('can replaceState with a function', function() {
    runtime.replaceState(currentState => ({ value3: 'value3' }))
    runtime.currentState.should.not.have.property('value1')
    runtime.currentState.should.have.property('value3', 'value3')
  })

  describe('event emitters', function() {
    it('emits an event before changing state', function() {
      const spy1 = sinon.spy() // eslint-disable-line
      let test = false

      runtime.setState({ stateWillChange: true })
      runtime.on('stateWillChange', previousState => {
        test = previousState.stateWillChange
        spy1(previousState)
      })
      runtime.setState({ stateWillChange: false })
      test.should.equal(true)
      spy1.should.have.been.called
    })

    it('emits an event on the global event bus any time the runtime changes state', function() {
      const spy1 = sinon.spy() // eslint-disable-line
      runtime.events.on('runtimeDidChange', spy1)
      runtime.setState({ changedGlobalEventBus: true })
      spy1.should.have.been.called
    })

    it('emits an event whenever any state changes', function() {
      const spy1 = sinon.spy() // eslint-disable-line
      const spy2 = sinon.spy() // eslint-disable-line
      runtime.on('stateDidChange', spy1)
      runtime.on('stateWasUpdated', spy2)
      spy1.should.not.have.been.called
      spy2.should.not.have.been.called
      runtime.setState({ changed: true })
      spy1.should.have.been.called
      spy2.should.have.been.called
    })

    it('emits a change event for any key which changes', function() {
      const spy1 = sinon.spy() // eslint-disable-line
      const spy2 = sinon.spy() // eslint-disable-line

      runtime.setState({ value1: 'value1', value2: 'value2' })

      runtime.on('value1DidChangeState', spy1)
      runtime.on('value2DidChangeState', spy2)

      runtime.setState({ value1: 'value2' })

      spy1.should.have.been.called
      spy2.should.not.have.been.called
    })
  })
})
