import { Runtime } from '../src/runtime'
import { Helper } from '../src/helper'

class Game extends Helper {
  static allowAnonymousProviders = true
  static isObservable = true

  async initialize() {
    this.setState({ initialized: true })
  }

  beforeInitialize() {
    this.setState({ beforeInitialize: true })
  }

  afterInitialize() {
    this.setState({ afterInitialize: true })
    this.emit('afterInitialize')
  }

  static attach(runtime) {
    Helper.attach(runtime, Game, {
      registry: Helper.createContextRegistry('games', {
        context: Helper.createMockContext(),
      }),
      lookupProp: 'game',
      registryProp: 'games',
    })
  }

  static optionTypes = {
    gameType: 'string',
  }
  /**
   * Called in the context of the game instance
   */
  static initialState(options, { my }) {
    return {
      gameType: my.options.gameType,
    }
  }
}

const runtime = new Runtime().use({ attach: Game.attach })

runtime.didCreateHelper = require('sinon').spy()


describe('Helper Lifecycle Methods', function() {
  /** 
   * The Helper Lifecycle system requires the runtime
   * instance to have factory methods defined on it by
   * the Helper class which attaches itself to the runtime.
   * 
   * These factory functions create instances of the Helper instead
   * of developers calling new Helper directly.
  */
 it('runtime.didCreateHelper hook', function() {
  runtime.game('holdem', { gameType: 'texas-holdem' })
  runtime.didCreateHelper.should.have.been.called
 })

 it('state set through helper subclass initialState static method', function() {
   const game = runtime.game('holdem', { gameType: 'texas-holdem' })
   game.should.have.property('currentState')
    .that.is.an('object')
    .that.has.property('gameType', 'texas-holdem')
 })

  it('state set through a function passed to the constructor', function() {
   const game = runtime.game('holdem', { initialState: () => ({ gameType: 'limit-holdem'}) })
   game.should.have.property('currentState')
    .that.is.an('object')
    .that.has.property('gameType', 'limit-holdem')
  })

  it('state set through an object ', function() {
   const game = runtime.game('holdem', { initialState: { gameType: 'limit-holdem' } })
   game.should.have.property('currentState')
    .that.is.an('object')
    .that.has.property('gameType', 'limit-holdem')
  })

  it('has initialize Hooks', async function() {
    const game = runtime.game('holdem', { initialState: () => ({ gameType: 'limit-holdem'}) })

    await game.untilStateMatches(({ beforeInitialize, initialized, afterInitialize }) => beforeInitialize && afterInitialize && initialized)

    game.currentState.should.have.property('afterInitialize', true)
  })
})