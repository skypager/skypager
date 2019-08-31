import uuid from 'uuid'
import { getter, hideGetter, hide } from './utils/prop-utils'
import State from './State'
import Bus from './Bus'

/**
 * The Entity class is for any object with a unique identity,
 * that needs observable state and event emitter interface
 */
export class Entity {
  static defaultOptions = {}

  constructor(options = {}) {
    this.uuid = uuid()
    this._options = options

    hide(this, 'uuid', this.uuid)

    this.state = new State()
    hide(this, 'state', this.state)

    this.emitter = new Bus()
    hide(this, 'emitter', this.emitter)
    hideGetter(this, '_options', () => options)

    let disposer

    const startObserving = () => {
      disposer = this.state.observe(({ name, oldValue, newValue, type, object }) => {
        this.emit(`${name}DidChangeState`, newValue, oldValue)
        const current = object.toJSON()
        this.emit('stateDidChange', current, {
          ...current,
          [name]: oldValue,
        })
      })
    }

    const stopObserving = () => {
      disposer && disposer()
      return this
    }

    this.startObservingState = startObserving
    this.stopObservingState = stopObserving
    getter(this, 'startObservingState', () => startObserving)
    getter(this, 'stopObservingState', () => stopObserving)
  }

  get options() {
    return {
      ...this.constructor.defaultOptions,
      ...this._options,
    }
  }

  get currentState() {
    return this.state.toJSON()
  }

  observe(observerFunction) {
    return this.state.observe(observerFunction)
  }

  setState(newState, cb) {
    const current = this.state.toJSON()

    if (typeof newState === 'function') {
      newState = newState(current, this)

      if (typeof newState.then === 'function') {
        Promise.resolve(newState).then(nextState => {
          const c = this.state.toJSON()
          this.setState(nextState, () => {
            cb && cb.call && cb.call(this, c)
          })
        })
        return
      } else {
        this.state.merge(newState)
        cb && cb.call && cb.call(this, this.state.toJSON())
      }

      return this
    }

    this.state.merge(newState)
    cb && cb.call && cb.call(this, this.state.toJSON())

    return this
  }

  on(event, callback) {
    this.emitter.on(event, callback)

    return () => {
      this.emitter.off(event, callback)
    }
  }

  emit(event, ...args) {
    this.emitter.emit(event, ...args)
    return this
  }

  once(event, callback) {
    this.emitter.once(event, callback)

    return () => {
      this.emitter.off(event, callback)
    }
  }

  off(event, callback) {
    return this.emitter.off(event, callback)
  }

  /**
   * Returns a promise which will resolve whenever the event gets fired next.
   *
   * @returns {Promise}
   */
  async nextEvent(event) {
    return new Promise(resolve => this.once(event, resolve))
  }

  /**
   * Returns a promise which will resolve whenever this entity's state is updated.
   *
   * @param {String} [attribute=undefined] an optional attribute to listen for changes to. By default will fire on any attribute change.
   * @returns {Promise}
   */
  async nextStateChange(attribute) {
    return new Promise(resolve => {
      const disposer = this.state.observe(update => {
        const { name } = update

        if (attribute && attribute === name) {
          disposer()
          resolve(this.state.toJSON())
        } else {
          disposer()
          resolve(this.state.toJSON())
        }
      })
    })
  }

  /**
   * Returns a promise which will resolve whenever this entity's state matches the
   * validator that gets passed.
   */
  async untilStateMatches(validator) {
    return new Promise(resolve => {
      const disposer = this.state.observe(update => {
        const current = update.object.toJSON()

        if (typeof validator === 'function' && validator(current)) {
          disposer()
          resolve(current)
        } else if (typeof validator === 'object') {
          const nonMatch = !!Object.keys(validator).find(prop => current[prop] !== validator.prop)
          if (!nonMatch) {
            disposer()
            resolve(current)
          }
        } else {
          disposer()
          resolve(current)
        }
      })
    })
  }
}

export default Entity
