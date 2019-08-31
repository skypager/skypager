export class Cache {
  constructor(init) {
    hide(this, 'hide', (...args) => hide(this, ...args))

    this.clear(init)
    this.write = (k, v) => this.set(k, v).get(k)
  }

  fetch(k, defaultValue) {
    if (this.has(k)) {
      return this.get(k)
    } else {
      this.set(k, typeof defaultValue === 'function' ? defaultValue(k) : defaultValue)
      return this.get(k)
    }
  }

  clear(init) {
    delete this._wm
    this._wm = new WeakMap()
  }

  delete(k) {
    return this._wm.delete({ k, cache: this })
  }

  get(k) {
    return this._wm.get({ k, cache: this })
  }

  has(k) {
    return this._wm.has({ k, cache: this })
  }

  set(k, v) {
    this._wm.set({ k, cache: this }, v)
    return this
  }
}

export default Cache

function hide(target, propName, value, configurable = false) {
  Object.defineProperty(target, propName, {
    enumerable: false,
    configurable,
    value,
  })

  return target
}
