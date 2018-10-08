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
    this._wm = new Map(init)
  }

  delete(k) {
    return this._wm.delete(k)
  }

  get(k) {
    return this._wm.get(k)
  }

  has(k) {
    return this._wm.has(k)
  }

  set(k, v) {
    this._wm.set(k, v)
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
