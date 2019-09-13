import State from '../src/State'
import { spy as createSpy } from 'sinon'

describe('State', function() {
  it('can wait until matching state', async function() {
    const state = new State()
    setTimeout(() => {
      state.set('condition', 'met')
    }, 10)
    await state.waitUntil({ condition: 'met' })
    const condition = state.get('condition') || {}
    condition.should.equal('met')
  })

  it('can wait until matching state with a timeout', async function() {
    const state = new State()
    const spy = createSpy()

    await state.waitUntil({ condition: 'met' }, { timeout: 40 }).catch(spy)
    spy.should.have.been.called
  })

  it('can merge in an object', function() {
    const state = new State()

    state.merge({ wow: 'nice', noWay: 'shhhhh' })

    state.get('wow').should.equal('nice')
    state.get('noWay').should.equal('shhhhh')
  })

  describe('observe', function() {
    it('can observe changes', function() {
      const state = new State()
      const spy = require('sinon').spy()

      state.observe(spy)

      state.set('wow', 'nice')
      state.set('wow', 'nice!')

      spy.should.have.been.calledTwice
    })

    it('can stop observing changes', function() {
      const state = new State()
      const spy = require('sinon').spy()

      const stop = state.observe(spy)

      stop.should.be.a('function')

      state.set('wow', 'nice')
      state.set('wow', 'nice!')
      stop()
      state.set('wow', 'not nice!')

      spy.should.have.been.calledTwice
    })
  })
})
