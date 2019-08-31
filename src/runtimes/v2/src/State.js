import hashObject from './utils/object-hash'
import { hide } from './utils/prop-utils'

/**
 * State provides an observable Map implementation
 */
export class State {
  observers = []

  members = new Map()

  constructor(options = {}) {
    const members = new Map()
    const observers = []

    this._hash = ''
    hide(this, '_hash', this._hash)

    Object.defineProperty(this, 'options', {
      enumerable: true,
      configurable: false,
      get: () => options,
    })

    Object.defineProperty(this, 'members', {
      enumerable: false,
      configurable: false,
      get: () => members,
    })

    Object.defineProperty(this, 'observers', {
      enumerable: false,
      configurable: false,
      get: () => observers,
    })
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

  observe(observerFunction) {
    this.observers.push(observerFunction)

    return () => {
      const index = this.observers.indexOf(observerFunction)
      this.observers.filter(Boolean).splice(index, 1)
      observerFunction.isDisposed = true
      return this
    }
  }

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

  get(prop) {
    return this.members.get(prop)
  }

  has(prop) {
    return this.members.has(prop)
  }

  merge(object = {}) {
    Object.entries(object).forEach(([key, value]) => {
      this.set(key, value, true)
    })

    notify(this, { type: 'merge', keys: Object.keys(object) })
    return this
  }

  clear(silent = false) {
    this.keys().forEach(key => {
      silent ? this.members.delete(key) : this.delete(key)
    })

    hide(this, '_hash', hashObject(this.toJSON()))

    return this
  }

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

  keys() {
    return Array.from(this.members.keys())
  }

  values() {
    return Array.from(this.members.values())
  }

  entries() {
    return Array.from(this.members.entries())
  }

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
