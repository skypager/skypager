import { Runtime } from '../src/runtime'
const { sinon } = global

describe('helper state', function() {
  const runtime = new Runtime()

  runtime.features.register('stateful-test', () => ({
    isObservable: true,
    initialState: {
      yoYo: 'what up'
    }  
  }))

  const helperInstance = runtime.feature('stateful-test')

  it('can await for an event to fire', async function() {
    helperInstance.setState({ patience: 0})
    
    setTimeout(() => {
      helperInstance.setState({ patience: 1})
      helperInstance.emit('doneWaiting')
    }, 15)
    
    helperInstance.currentState.should.have.property('patience', 0)   

    await helperInstance.nextEvent('doneWaiting')

    helperInstance.currentState.should.have.property('patience', 1)   
  })

  it('can await for the state to match', async function() {
    helperInstance.setState({ patientlyWaiting: true })

    setTimeout(() => {
      helperInstance.setState({ patientlyWaiting: false })
    }, 15)
    
    await helperInstance.untilStateMatches({ patientlyWaiting: false })

    helperInstance.currentState.should.have.property('patientlyWaiting', false)
  })

  it('can setState', function() {
    helperInstance.setState({
      value1: 'value1',
      value2: 'value2',
    })

    helperInstance.currentState.value1.should.equal('value1')
    helperInstance.currentState.value2.should.equal('value2')
  })

  it('can handle a setState function', function() {
    helperInstance.setState({ originalValue: 1 })
    helperInstance.setState(currentState => ({
      originalValue: currentState.originalValue + 1,
    }))
    helperInstance.currentState.originalValue.should.equal(2)
  })

  it('can handle a setState callback with a state function', function() {
    const spy1 = sinon.spy()
    helperInstance.setState({ originalValue: 1 })
    helperInstance.setState(
      currentState => ({
        originalValue: currentState.originalValue + 1,
      }),
      spy1
    )

    spy1.should.have.been.called
  })

  it('can handle a setState callback with a state object', function() {
    const spy1 = sinon.spy()
    helperInstance.setState({ originalValue: 1 })
    helperInstance.setState({ originalValue: 2 }, spy1)

    spy1.should.have.been.called
  })

  it('can replaceState', function() {
    helperInstance.replaceState({ value3: 'value3' })

    helperInstance.currentState.should.not.have.property('value1')
    helperInstance.currentState.should.have.property('value3', 'value3')
  })

  it('can replaceState with a callback', function() {
    const spy1 = sinon.spy()

    helperInstance.replaceState({ value3: 'value3' }, spy1)

    helperInstance.currentState.should.not.have.property('value1')
    helperInstance.currentState.should.have.property('value3', 'value3')
    spy1.should.have.been.called
  })

  it('can replaceState with a function', function() {
    helperInstance.replaceState(currentState => ({ value3: 'value3' }))
    helperInstance.currentState.should.not.have.property('value1')
    helperInstance.currentState.should.have.property('value3', 'value3')
  })

})