import State from './State'
import Bus, { attach as attachEmitter } from './Bus'
import { hide } from './utils/prop-utils'

export class Registry extends State {
  constructor(options = {}) {
    super(options)

    const events = new Bus()
    this.emitter = events
    hide(this, 'emitter', events)
  }

  get available() {
    return Array.from(this.keys())
  }

  register(moduleId, loaderFunction) {
    this.set(moduleId, loaderFunction)
  }

  lookup(moduleId) {
    moduleId = this.resolve(moduleId)
    const loader = this.get(moduleId)

    if (typeof loader === 'function') {
      return loader()
    } else {
      return loader
    }
  }

  resolve(moduleId) {
    if (this.has(moduleId)) {
      return moduleId
    }

    return false
  }

  on(e, cb) {
    return this.emitter.on(e, cb)
  }

  off(e, cb) {
    return this.emitter.off(e, cb)
  }

  once(e, cb) {
    return this.emitter.once(e, cb)
  }

  emit(e, ...args) {
    return this.emitter.emit(e, ...args)
  }
}

export default Registry
