import hashObject from './utils/object-hash'
import { hide } from './utils/prop-utils'

/**
 * State provides an observable Map implementation
 */
export class State {
  observers = []

  members = new Map()

  /**
   * @param {Object} options
   * @param {Object|Function} [options.initialState={}] initial state
   * @param {Function} [options.onChange=undefined] a permanent observer function.
   */
  constructor({ onChange, initialState = {}, ...options } = {}) {
    const members = new Map(buildInitialState(initialState))
    const observers = [onChange].filter(o => typeof o === 'function')

    this._hash = ''
    hide(this, '_hash', this._hash)

    this._options = options
    hide(this, '_options', options, {
      configurable: false,
      writable: false,
    })

    /** @type {Object|Function} */
    this.initialState = initialState
    hide(this, 'initialState', initialState, {
      configurable: false,
      writable: false,
    })

    hide(this, 'members', members, {
      configurable: false,
      writable: false,
    })

    hide(this, 'observers', observers, {
      configurable: false,
      writable: false,
    })
  }

  get options() {
    return this._options
  }

  /**
   * Get every value from state except for ones which the iterator returns true.
   */
  omitBy(fn) {
    return this.entries().reduce(
      (memo, entry) => (fn(...entry) ? memo : { ...memo, [entry[0]]: entry[1] }),
      {}
    )
  }

  /**
   * Get every value from state for which the iterator returns true.
   */
  pickBy(fn) {
    return this.entries().reduce(
      (memo, entry) => (!fn(...entry) ? memo : { ...memo, [entry[0]]: entry[1] }),
      {}
    )
  }

  /**
   * Get every value from state except these attributes
   */
  omit(...keys) {
    keys = keys.flat()
    return this.entries().reduce(
      (memo, entry) => (keys.indexOf(entry[0]) > -1 ? memo : { ...memo, [entry[0]]: entry[1] }),
      {}
    )
  }

  /**
   * Pick a few attributes from state
   */
  pick(...keys) {
    keys = keys.flat()
    return this.entries().reduce(
      (memo, entry) => (keys.indexOf(entry[0]) === -1 ? memo : { ...memo, [entry[0]]: entry[1] }),
      {}
    )
  }

  /**
   * Returns an md5 hash of the state contents. This is computed
   * whenever the state is modified.
   *
   * @type {String}
   */
  get hash() {
    return this._hash || hashObject(this.toJSON())
  }

  /**
   * Observe changes to state with an observer function which will be called with
   *  - type: update | delete | add | reset
   *  - oldValue
   *  - newValue
   *  - object: this
   *
   * Returns a function which will stop observing.
   *
   * @param {Function} observerFunction
   * @returns {Function}
   */
  observe(observerFunction) {
    this.observers.push(observerFunction)

    return () => {
      const index = this.observers.indexOf(observerFunction)
      this.observers.filter(Boolean).splice(index, 1)
      observerFunction.isDisposed = true
      return this
    }
  }

  /**
   * Set a single attribute / value combo.  This will notify any observers that
   * there has been a change.
   *
   * @param {String} prop
   * @param {*} newValue
   * @param {Boolean} [silent=false] pass true to skip notifying observers.
   * @returns {this}
   */
  set(prop, newValue, silent = false) {
    const exists = this.has(prop)

    if (exists) {
      const oldValue = this.get(prop)
      this.members.set(prop, newValue)
      !silent && notify(this, { name: prop, oldValue, newValue, type: 'update', object: this })
    } else {
      this.members.set(prop, newValue)
      !silent &&
        notify(this, { name: prop, oldValue: undefined, newValue, type: 'add', object: this })
    }

    hide(this, '_hash', hashObject(this.toJSON()))

    return this
  }

  /**
   * Retrieve a single attribute / value combo.
   *
   * @param {String} prop
   * @returns {*}
   */
  get(prop) {
    return this.members.get(prop)
  }

  /**
   * Returns true if we have that attribute in our state.
   * @returns {Boolean}
   */
  has(prop) {
    return this.members.has(prop)
  }

  /**
   * Update multiple attribute / value entries by passing a single
   * object, whose keys and values will be used.
   *
   * @param {Object<String,*>} object
   * @param {Boolean} silent
   * @return {this}
   */
  merge(object = {}, silent = false) {
    Object.entries(object).forEach(([key, value]) => {
      this.set(key, value, silent)
    })

    return this
  }

  /**
   * Resets the state to its initial value.
   *
   * Notifies any observers of a single "reset" event.
   *
   * @param {Boolean} [silent=false] pass true to skip notifying observers about the reset.
   * @return {this}
   */
  reset(silent = false) {
    this.clear(true)
    Object.entries(buildInitialState(this.initialState)).forEach(([key, value]) => {
      this.set(key, value, true)
    })

    hide(this, '_hash', hashObject(this.toJSON()))

    !silent && notify(this, { type: 'reset', newValue: this.toJSON() })

    return this
  }

  /**
   * Empty state completely and reset it to empty.  Use reset if you wish to retain
   * the initial state.  Will not notify any observers unless requested.
   *
   * @param {Boolean} [silent=false]
   * @return {this}
   */
  clear(silent = true) {
    this.keys().forEach(key => {
      silent ? this.members.delete(key) : this.delete(key)
    })

    hide(this, '_hash', hashObject(this.toJSON()))

    return this
  }

  /**
   * Remove a property from state.  Will notify any observers of an update of type delete,
   * with the oldValue
   *
   * @param {String} prop
   * @param {Boolean} [silent=false] pass true to skip notifying observers
   * @return {this}
   */
  delete(prop, silent = false) {
    if (!this.has(prop)) {
      return this
    }

    const oldValue = this.members.get(prop)
    this.members.delete(prop)

    hide(this, '_hash', hashObject(this.toJSON()))

    !silent &&
      notify(this, { name: prop, oldValue, newValue: undefined, type: 'delete', object: this })

    return this
  }

  /**
   * @returns {Array<String>}
   */
  keys() {
    return Array.from(this.members.keys())
  }

  /**
   * @returns {Array<*>}
   */
  values() {
    return Array.from(this.members.values())
  }

  /**
   * @returns {Array<Array<String,*>>}
   */
  entries() {
    return Array.from(this.members.entries())
  }

  /**
   * @returns {Object<String,*>}
   */
  toJSON() {
    return this.entries().reduce((memo, entry) => {
      const [key, value] = entry
      return {
        ...memo,
        [key]: value,
      }
    }, {})
  }
}

function notify({ observers = [] } = {}, change = {}) {
  observers.filter(Boolean).forEach(observerFunction => {
    if (!observerFunction.isDisposed) {
      observerFunction(change)
    }
  })
}

export default State

/**
 * @param {Object|Function} initialState
 */
function buildInitialState(initialState) {
  if (typeof initialState === 'function') {
    initialState = initialState()
  }

  return Object.entries(initialState)
}