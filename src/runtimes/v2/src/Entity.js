import uuid from 'uuid'
import { lazy, getter, hideGetter, hide } from './utils/prop-utils'
import State from './State'
import Bus from './Bus'

/**
 * The Entity class is for any object with a unique identity,
 * that needs observable state and event emitter interface
 */
export class Entity {
  static defaultOptions = {}

  /**
   * @param {Object} options
   * @param {String} [options.name]
   * @param {String} [options.uuid]
   * @param {Object|Function} [options.initialState]
   */
  constructor({ name, initialState = undefined, ...options } = {}) {
    this._options = options
    hideGetter(this, '_options', () => options)

    this.uuid = options.uuid || uuid()
    hide(this, 'uuid', this.uuid)

    initialState = initialState || this.initialState || this.constructor.initialState

    if (typeof initialState === 'function') {
      initialState = initialState.bind(this)
    }

    this.state = new State({ initialState })

    // non-configurable
    hide(this, 'state', this.state, { configurable: false, writable: false })
    hide(this, 'initialState', initialState, { configurable: true, writable: false })

    // non-configurable
    this.emitter = new Bus()
    hide(this, 'emitter', this.emitter, { configurable: false, writable: false })

    let disposer

    const startObserving = () => {
      disposer && disposer()
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
    hideGetter(this, 'startObservingState', () => startObserving)
    hideGetter(this, 'stopObservingState', () => stopObserving)

    this._name = String(name || uniqueName(this))
    hide(this, '_name', this._name)
  }

  get name() {
    return this._name
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

    if (event.match(/DidChange/)) {
      this.startObservingState()
    }

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
   * @experimental
   *
   * I want to have declarative hooks similar to webpack tapable,
   * should get automatic before / after hooks (e.g. fireHook('initialize') will try beforeInitialize and afterInitialize)
   */
  fireHook(hookName, ...args) {
    if (!this.emitter) {
      throw new Error('no emitter present')
    }
    
    this.emit(hookName, ...args)

    if (this[hookName] && typeof this[hookName] === 'function') {
      Promise.resolve(this[hookName].call(this, ...args)).catch(error => {
        this.emit(`hookFailure`, hookName, error)
      })
    }

    return this
  }

  lazy(propName, fn, options) {
    return lazy(this, propName, fn, options)
  }

  getter(propName, fn, options) {
    return getter(this, propName, fn, options)
  }

  hide(propName, value, options) {
    return hide(this, propName, value, options)
  }

  hideGetter(propName, fn, options) {
    return hideGetter(this, propName, fn, options)
  }

  /**
   * Returns a promise which will resolve whenever the event gets fired next.
   *
   * @returns {Promise}
   */
  async nextEvent(event, { timeout = 2000 } = {}) {
    const waitForEvent = (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for ${event} on ${this.name}`))  
      }, timeout)

      this.once(event, (...args) => {
        clearTimeout(timer)
        resolve(...args)
      }) 

    }

    return new Promise(waitForEvent)
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
        const { name, object } = update

        if (attribute && attribute === name) {
          disposer()
          resolve(object.toJSON())
        } else {
          disposer()
          resolve(object.toJSON())
        }
      })
    })
  }

  /**
   * Returns a promise which will resolve whenever this entity's state matches the
   * validator that gets passed.
   * 
   * @param {Function|Object} validator
   * @param {Object} options 
   * @param {Number} [options.timeout=2000] how many ms to wait before throwing an error
   * @param {Number} [options.interval=20] how often to recheck in ms
   */
  async untilStateMatches(validator, { timeout = 2000, interval = 20 } = {}) {
    await this.state.waitUntil(validator, { timeout, interval })
    return this
  }
}

export default Entity

const names = new Map()
function uniqueName(entity) {
  const name = entity.componentName || entity.constructor.name

  if (!names.has(name)) {
    names.set(name, 0)
  }

  names.set(name, names.get(name) + 1)
  return `${name}${names.get(name)}`
}
