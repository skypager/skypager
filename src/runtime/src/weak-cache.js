import { toPairs, isObject } from 'lodash'
import { hideGetter, hide } from './utils/properties'

const privates = new WeakMap()

const createMap = (obj = {}) => {
  if (isObject(obj)) obj = toPairs(obj)
  return new Map(obj)
}

export class WeakCache {
  constructor(init = {}) {
    this.hide = (...args) => hide(this, ...args)
    this.hideGetter = (...args) => hideGetter(this, ...args)

    const anchor = this

    this.clear = init => {
      privates.delete(anchor)
      privates.set(anchor, createMap(init))
      return this
    }

    this.hideGetter('_wm', function() {
      if (privates.has(anchor)) {
        return privates.get(anchor)
      }
      return privates.set(anchor, createMap(init)).get(anchor)
    })

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

export default WeakCache
