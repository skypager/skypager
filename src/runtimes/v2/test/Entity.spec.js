import Entity from '../src/Entity'

describe('Entity', function() {
  describe('Hooks API', function() {
    it('can fire hooks', function() {
      const entity = new Entity()
      const spy = require('sinon').spy()
      entity.onFinish = spy
      entity.fireHook('onFinish')
      spy.should.have.been.called
    })
  })

  describe('Event Emitter APIs', function() {
    it('supports standard event emitter interface', function() {
      const spy = require('sinon').spy()
      const spy2 = require('sinon').spy()
      const entity = new Entity()
      entity.should.have.property('on').that.is.a('function')
      entity.should.have.property('once').that.is.a('function')
      entity.should.have.property('off').that.is.a('function')
      entity.should.have.property('emit').that.is.a('function')

      entity.on('wow', spy)
      entity.once('wow', spy2)

      entity.emit('wow')
      entity.emit('wow')
      entity.off('wow', spy)
      entity.emit('wow')

      spy2.should.have.been.calledOnce
      spy.should.have.been.calledTwice
    })
  })

  describe('State APIs', function() {
    it('sets state with a callback', function() {
      const spy = require('sinon').spy()
      const entity = new Entity()
      entity.setState({ newState: 1 }, spy)
      spy.should.have.been.called
    })

    it('sets state with async functions', async function() {
      const spy = require('sinon').spy()
      const entity = new Entity()
      await entity.setState(
        async function() {
          return {
            newState: 1,
          }
        },
        function() {
          spy(this.currentState.newState)
        }
      )
      entity.currentState.newState.should.equal(1)
      spy.should.have.been.calledWith(1)
    })

    it('setState w/ object', function() {
      const entity = new Entity()
      entity.setState({ newState: 1 })
      entity.currentState.newState.should.equal(1)
    })

    it('setState w/ function', function() {
      const entity = new Entity()
      entity.setState({ newState: 1 })
      entity.setState(current => ({
        ...current,
        newState: current.newState + 1,
      }))
      entity.currentState.newState.should.equal(2)
    })

    it('observe state', function() {
      const spy = require('sinon').spy()
      const entity = new Entity()
      entity.observe(spy)

      entity.setState({ newState: 1 })
      entity.setState({ newState: 2 })
      entity.setState({ newState: 3 })

      spy.should.have.been.calledThrice
    })

    it('can emit state change events', function() {
      const spy = require('sinon').spy()
      const spy2 = require('sinon').spy()
      const entity = new Entity()

      entity.startObservingState()
      entity.on('stateDidChange', spy)
      entity.on('newStateDidChangeState', spy2)

      entity.setState({ newState: 1 })

      spy.should.have.been.called
      spy2.should.have.been.called
    })

    it('awaits the next state change', async function() {
      const entity = new Entity()
      setTimeout(() => {
        entity.setState({ yo: 1 })
      }, 10)
      await entity.nextStateChange()
      entity.currentState.yo.should.equal(1)
    })

    it('awaits the next event', async function() {
      const entity = new Entity()

      entity.startObservingState()

      setTimeout(() => {
        entity.setState({ yo: 1 })
      }, 10)

      await entity.nextEvent('stateDidChange')
      entity.currentState.yo.should.equal(1)
    })

    it('awaits the next matching state', async function() {
      const entity = new Entity()
      setTimeout(() => {
        entity.setState({ yo: 2 })
        entity.setState({ yo: 1 })
        entity.setState({ yo: 3 })
      }, 10)
      await entity.untilStateMatches({ yo: 3 })
      entity.currentState.yo.should.equal(3)
    })
  })
})
