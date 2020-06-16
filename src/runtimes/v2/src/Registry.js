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
   * @param {String} options.name
   * @param {Object} [options.api={}] an object of functions to extend this instance of the registry with.
   * @param {Function} [options.formatId] a function which will take an arbitrary id and format it according to the registry's own naming logic requirements.
   */
  constructor(options = {}) {
    super(omit(options, 'name', 'api', 'formatId'))

    const metadata = new State()
    this.metadata = metadata
    hide(this, 'metadata', metadata)

    const events = new Bus()
    this.emitter = events
    hide(this, 'emitter', events)

    const { name, formatId, api } = options

    this._name = name
    hide(this, '_name', name, false)
    this.idFormatter = typeof formatId === 'function' ? formatId : id => id

    if (api) {
      applyInterface(this, api, {
        insertOptions: false,
        partial: [],
        right: false,
        hidden: false,
        configurable: true,
      })
    }
  }

  get name() {
    return this._name
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
        ...(this.metadata.get(moduleId) || {}),
        ...patch,
      })
    }

    return this.metadata.get(moduleId) || {}
  }

  /**
   * Register a module loading function with the registry, including
   * optional metadata about the module.
   *
   * @param {String} moduleId
   * @param {Function} loaderFunction
   * @param {Object} [meta=undefined]
   */
  register(moduleId, loaderFunction, meta = undefined) {
    const registryId = this.formatId(moduleId)

    if (typeof loaderFunction !== 'function') {
      return this.register(registryId, () => loaderFunction, meta)
    }

    this.set(registryId, loaderFunction)

    if (meta) {
      this.meta(registryId, meta)
    }

    return this
  }

  /**
   * @alias request
   */
  lookup(moduleId) {
    return this.request(moduleId)
  }

  /**
   * Requests a module that has been registered with us.
   *
   * @param {String} moduleId
   * @returns {*|Promise<*>}
   */
  request(requestId) {
    const moduleId = this.resolve(requestId)

    if (!this.has(moduleId)) {
      throw new ModuleNotRegisteredError(this, requestId)
    }

    const loader = this.get(moduleId)

    const result = loader()

    if (typeof result.then === 'function') {
      return Promise.resolve(result).then(loaded => {
        this.set(moduleId, () => loaded)
        return loaded
      })
    } else {
      this.emit('loaded', moduleId, result)
      return result
    }
  }

  /**
   * Get the actual moduleId for a given request.
   * @param {String} moduleId
   * @returns {String}
   */
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

export class ModuleNotRegisteredError extends Error {
  constructor(registry, moduleId) {
    super(`Registry ${registry.name} does not contain any module named ${moduleId}.`)
  }
}

export default Registry
