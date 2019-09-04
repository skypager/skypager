import State from './State'
import Bus, { attach as attachEmitter } from './Bus'
import { applyInterface, hide } from './utils/prop-utils'
import { omit } from './lodash'

/** 
 * The Registry inherits from the State class which is
 * a simple observable Map.  
*/
export class Registry extends State {
  /** 
   * @param {Object} options 
   * @param {Object} [options.api={}] an object of functions to extend this instance of the registry with.
   * @param {Function} [options.formatId] a function which will take an arbitrary id and format it according to the registry's own naming logic requirements.
  */
  constructor(options = {}) {
    super(omit(options, 'api', 'formatId'))

    const metadata = new State()
    this.metadata = metadata
    hide(this, 'metadata', metadata)

    const events = new Bus()
    this.emitter = events
    hide(this, 'emitter', events)

    const { formatId, api } = options

    this.idFormatter = typeof formatId === 'function'
      ? formatId
      : (id) => id

    if (api) {
      applyInterface(this, api, {
        insertOptions: false,
        partial: [],
        right: false,
        hidden: false,
        configurable: true
      })
    } 
  }

  /** 
   * Lists the names of the modules which have been registered
   * with this registry.
   * 
   * @type {Array<String>}
  */
  get available() {
    return Array.from(this.keys())
  }

  /** 
   * Applies the id formatter 
   * @private
  */
  formatId(id) {
    return this.idFormatter(id, this)
  }

  /** 
   * Update the meta about the module. Meta is a key / value store
   * that can contain arbitrary attributes about a module registered
   * in the registry.
   * 
   * @param {String} moduleId
   * @param {Object} [patch=undefined]
  */
  meta(moduleId, patch) {
    moduleId = this.formatId(moduleId)

    if (typeof patch === 'object') {
      this.metadata.set(moduleId, {
        ...this.metadata.get(moduleId) || {},
      })
    }

    return this.metadata.get(moduleId)
  }

  register(moduleId, loaderFunction, meta) {
    const registryId = this.formatId(moduleId)

    if (typeof loaderFunction !== 'function') {
      return this.register(registryId, () => loaderFunction)    
    }
    
    this.set(registryId, loaderFunction)

    if (meta) {
      this.meta(registryId, meta)
    }

    return this
  }

  lookup(moduleId) {
    return this.request(moduleId)
  }

  request(moduleId) {
    moduleId = this.resolve(moduleId)

    const loader = this.get(moduleId)

    if (typeof loader === 'function') {
      const result = loader()
      this.emit('loaded', moduleId, result)
      return result
    } else {
      this.emit('loaded', moduleId, loader)
      return loader
    }
  }

  resolve(moduleId) {
    if (this.has(moduleId)) {
      return moduleId
    } 

    const formatted = this.formatId(moduleId)

    return this.has(formatted) && formatted
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
