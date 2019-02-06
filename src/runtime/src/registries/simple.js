import lodash from 'lodash'
import { enhanceObject } from '../utils/properties'
import query from '../utils/query'
import registry from './registry'
import router from './router'

const { pickBy, mapValues, isFunction, isObject, has, get, pick } = lodash

export class SimpleRegistry {
  /**
   * Attach a registry to a host
   *
   * @example
   * 	SimpleRegistry.attach('components').to(host)
   */
  static attach(name, options = {}, cache = {}) {
    return {
      to(target) {
        registry(target, name, options, cache)
        return get(target, name)
      },
    }
  }

  static create(name, options = {}, cache = {}) {
    return new this(name, options, (cache = {}))
  }

  /**
   * Create a new Simple Registry
   * @param  {String} name   The name of this registry
   * @param  {Object} options =             {} Options
   * @param  {Function} options.init a function which will be called with the registry after it is initialize.
   * @param  {Function} options.fallback called whenever an invalid lookup request returns
   * @param  {Boolean} options.useDefaultExport - when a component is found, check to see if there is a default export and if so use that
   *
   * @return {SimpleRegistry}        The SimpleRegistry
   */
  constructor(name, options = {}, cache = {}) {
    this.name = name

    enhanceObject(this, lodash)

    hide(this, 'options', {
      router: {},
      ...options,
      name,
    })

    hide(this, 'createRouter', (options = {}) => router(this, options))

    hide(this, 'internalAliases', {})
    hide(this, 'internalRegistries', {})

    this.createRouter()

    this.attach('registry', cache)

    if (isFunction(options.init)) {
      options.init.call(this, this, options)
    }

    if (isFunction(options.componentWillRegister)) {
      this.componentWillRegister = options.componentWillRegister.bind(this)
    }

    if (isFunction(options.componentWasFound)) {
      this.componentWasFound = options.componentWasFound.bind(this)
    }

    if (isFunction(options.fallback)) {
      this.fallback = options.fallback.bind(this)
    } else if (isObject(options.fallback) && isFunction(options.fallback.lookup)) {
      this.fallback = lookupId => options.fallback.lookup(lookupId)
    }

    if (isFunction(options.wrapper)) {
      this.wrapResult = options.wrapper.bind(this)
    }
  }

  query(items = [], params = {}) {
    return query(items, params)
  }

  add(registry) {
    has(registry, 'available') && has(registry, 'lookup')
      ? registry.available.forEach(key => this.register(key, () => registry.lookup(key)))
      : Object.keys(registry).forEach(key => this.register(key, () => registry[key]))

    return this
  }

  convertToRequireContext(object = this) {
    const fn = this.lookup.bind(this)

    return Object.assign(fn, {
      resolve(id) {
        const resolved = has(object, 'checkKey')
          ? object.checkKey.call(object, id)
          : has(object, id) && object[id]
        if (!resolved) {
          throw new Error(`could not find ${id} in context`)
        }
        return resolved
      },
      keys() {
        return get(object, 'available', Object.keys(object))
      },
    })
  }

  get asRequireContext() {
    return this.convertToRequireContext()
  }

  /**
   * Returns an array of the component ids this registry knows about.
   * @return {String[]} - an array of component ids
   */
  get available() {
    return get(this, 'registry.available', [])
  }

  findAliases(key) {
    return Object.keys(pickBy(this.internalAliases, (v, k) => k === key || v === key))
  }

  /**
   * Register a component with the registry
   *
   * @param {String} componentId
   * @param {Function} componentFn
   * @param {Object} options
   * @memberof SimpleRegistry
   */
  register(...args) {
    return this._register(...args)
  }

  _register(componentId, componentFn, options = {}) {
    const {
      formatId = this.options.formatId,
      registryName = 'registry',
      namespace = get(this, 'options.namespace', ''),
    } = options

    if (typeof formatId === 'function') {
      componentId = formatId.call(this, componentId, componentFn, registryName) || componentId
    }

    componentId = componentId.trim()

    const [registryId, componentEntry] = this.componentWillRegister(componentId, componentFn)

    if (typeof options.alias === 'string') {
      this.alias(options.alias, registryId)
    }

    if (typeof this.options.alias === 'function') {
      const aliasMap = this.options.alias.call(this, registryId, componentFn, options)

      mapValues(aliasMap, (realId, alias) => {
        this.alias(alias, realId)
      })
    }

    if (typeof registryId !== 'string' && typeof componentEntry !== 'function') {
      this.componentRegistrationDidFail(componentId, componentFn, registryId, componentEntry)
      throw new Error('Component Registration Failed')
    }

    return this[registryName].register(`${namespace}${registryId}`, componentEntry)
  }

  get childRegistryNames() {
    return Object.keys(this.internalRegistries)
  }

  alias(aliasId, realId) {
    this.internalAliases[aliasId] = realId
    return this
  }

  checkKey(componentId, registryName = 'registry') {
    if (has(this[registryName], componentId)) {
      return componentId
    } else if (has(this.internalAliases, componentId)) {
      return get(this, ['internalAliases', componentId])
    } else {
      return false
    }
  }

  childRegistries() {
    return pick(this, this.childRegistryNames)
  }

  lookupAll(componentId) {
    return mapValues(pickBy(this.childRegistries(), (reg, k) => has(reg, componentId)), reg =>
      get(reg, componentId)
    )
  }

  lookup(componentId, registryName = 'registry') {
    const lookupId = this.willLookupById(componentId) || `${componentId}`
    const result = get(this[registryName], this.checkKey(lookupId, registryName))

    return result
      ? this.componentWasFound(result, lookupId, componentId)
      : this.performFallbackLookup(lookupId, componentId)
  }

  findRawMember(componentId, registryName = 'registry') {
    const lookupId = this.willLookupById(componentId) || `${componentId}`
    const result = get(this[registryName], this.checkKey(lookupId, registryName))

    return result
  }

  enhance(componentId, enhancerFn, registryName = 'registry', useDefault = false) {
    const member = this.findRawMember(componentId, registryName)

    if (member) {
      this.register(
        componentId,
        typeof enhancerFn === 'function' ? enhancerFn(member) : Object.assign(member, enhancerFn)
      )
    }

    return this
  }

  /**
   * Creates a primitive registry interface and attaches it to this one.
   *
   * @param  {String} name - the name of the registry, and which property to assign it to
   * @param  {Object} options - an options hash for the registry primitive
   * @return {Registry}        the registry object
   */
  attach(name, options) {
    this.constructor.attach(name, options).to(this)

    this.internalRegistries[name] = name

    return get(this, name)
  }

  /**
   * Attach a group of child registries to this one.
   *
   * @param  {Object} map - an object whose keys are the registry name,
   *                      and whose values are the options for the registry create method
   *
   * @return {SimpleRegistry}    Returns this registry
   */
  attachAll(map) {
    const target = this
    return mapValues(map, (options, name) => target.attach(name, options))
  }

  /**
   * Intercepts an attempt to lookup a component by id, giving you an opportunity
   * to alter it if you like. Can be used for aliasing, logging, or whatever.
   * This function should return a component id that will be used to access the desired
   * object in the internal registry.
   *
   * @param  {String} requestedComponentId - the component id that is being looked up
   * @return {String} - the component id that will be used to perform the lookup.
   */
  willLookupById(requestedComponentId) {
    return requestedComponentId
  }

  /**
   * A Lifecycle hook called prior to a component being registered.
   * It should return an array that contains the actual componentId
   * that should be used, and a function which returns the desired component.
   *
   * By default it will just pass the arguments back, but this exists to be
   * overridden.
   *
   * @param  {String} componentId - the id of the component that was passed to register
   * @param  {Function} component - a function that will return the component that was registered
   * @return {Array} - the componentId and function that will actually be registered.
   */
  componentWillRegister(componentId, component) {
    return [componentId, component]
  }

  /**
   * A hook that will get called whenever a component is successfully looked up.
   * This can be used to modify the returning object however you see fit.
   */
  componentWasFound(component, lookupId, requestedComponentId) {
    // eslint-disable-line no-unused-vars
    component =
      component.default && (this.options.useDefaultExport || this.options.useDefaultExports)
        ? component.default
        : component

    return isFunction(this.wrapResult)
      ? this.wrapResult(component, lookupId, requestedComponentId)
      : component
  }

  performFallbackLookup(lookupId) {
    if (!this.fallback) {
      return this.componentLookupFailed(lookupId)
    }

    const result = this.fallback(lookupId)

    return result ? this.componentWasFound(result, lookupId) : this.componentLookupFailed(lookupId)
  }

  /**
   * Handle a component lookup failure.
   */
  componentLookupFailed(lookupId) {
    if (!this.options.silenceFailures) {
      throw new Error(
        `Component Lookup Failed: ${lookupId}.\n\nDid you mean one of the following?\n${this.available.join(
          '\n'
        )}`
      )
    }
  }

  get all() {
    return Object.values(this.allMembers())
  }

  allMembers() {
    const reg = this

    return this.available.reduce(
      (memo, key) => ({
        ...memo,
        get [key]() {
          return reg.lookup(key)
        },
      }),
      {}
    )
  }
}

export default SimpleRegistry

export const create = (...args) => SimpleRegistry.create(...args)

function hide(t, p, value, configurable) {
  Object.defineProperty(t, p, { value, configurable, enumerable: false })
}
