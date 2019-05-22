import lodash from 'lodash'
import { hashObject, hideProperty, lazy, enhanceObject, propertyUtils } from './utils/properties'
import { attach as attachEmitter } from './utils/emitter'
import { camelCase, snakeCase, singularize, pluralize } from './utils/string'
import ContextRegistry from './registries/context'
import uuid from 'uuid'

/**
 * @typedef { import("./runtime").Runtime } Runtime
 */

/**
 * @typedef { import("./utils/properties").Mixin } Mixin
 */

/**
 * @typedef { import("./utils/properties").MixinOptions } MixinOptions
 */

/**
 * @typedef {Object<string,*>} HelperAttachOptions
 * @property {String} lookupProp the property name to use for the factory function that will be attached to the Helper's host.
 * @property {String} registryProp the property name to use for the registry that will know about each of the Helpers available.
 * @property {ContextRegistry} registry an instance of a registry that will contain references to each of the Helper modules.
 * @property {Boolean} cacheHelper whether to cache the helper instance.
 * @property {Boolean} isCacheable whether to cache the helper instance.
 */
const {
  flatten,
  castArray,
  isUndefined,
  partialRight,
  mapValues,
  pickBy,
  isFunction,
  omitBy,
  defaults,
  defaultsDeep,
  omit,
  result,
  keys,
  has,
} = lodash

const req = createMockContext({})

let REGISTRY

REGISTRY =
  REGISTRY ||
  new ContextRegistry('helpers', {
    context: req,
    componentWillRegister(...args) {
      return args
    },
  })

export class ContextError extends Error {}
export class HostError extends Error {}
export class OptionsError extends Error {}
export class ProviderError extends Error {}

/**
 * @class       Helper
 * @classdesc   Helpers act as a registry for specific types of Javascript modules
 *              that are to be made available to a project runtime.  Helpers exist to provide
 *              common behavior, interfaces, and life cycle events and hooks for all types of things
 *              such as servers, compilers, commands, or anything else that can be categorized and grouped.
 *              Helpers are designed to be shared across multiple projects, and there are event Project Type helpers
 *              which exist to make specific types of helpers available to specific types of projects.
 */

export class Helper {
  /**
   * @param {Object} options
   * @param {Object} [options.provider={}] the exports of module which is being wrapped
   * @param {String} [options.name] the name of the helper
   * @param {Boolean} [options.initialize] whether or not to run the initialize function, useful for testing
   */
  constructor(options = {}, context = {}) {
    enhanceObject(
      this,
      {
        propUtils: false,
        includeLodashMethods: false,
        includeChain: false,
      },
      lodash
    )

    attachEmitter(this)

    const runtime = context.runtime || context.host || context.project
    const id = [runtime.id || this.registryName, this.name, Math.floor(new Date() / 100)].join(':')
    const { provider = {}, ...restOfOptions } = options

    this.hideProperties({
      _id: id,
      _runtime: runtime,
      _provider: provider,
      _context: context,
      _options: restOfOptions,
      _name: options.name,
      uuid: uuid(),
    })

    try {
      this.hideGetter(`is${this.constructor.helperName || this.constructor.name}`, () => true)
    } catch (error) {}

    if (runtime.beforeHelperCreate) {
      runtime.beforeHelperCreate(this, options, context, this.constructor)
    }

    if (options.initialize !== false) {
      this.doInitialize()
    }
  }

  /**
   * This is a special property that provides a safe way of detecting if something is a class and subclasses Helper
   * @static
   * @readonly
   * @memberof Helper
   */
  static get isSkypagerHelper() {
    return true
  }

  static helperName = 'Helper'

  static registry = REGISTRY

  static ContextRegistry = ContextRegistry

  static ContextError = ContextError

  static OptionsError = OptionsError

  static ProviderError = ProviderError

  static get features() {
    return Helper.registry.lookup('feature').Feature.registry
  }

  static events = attachEmitter({})

  static registerHelper(name, fn, options = {}) {
    const reg = fn && fn.prototype instanceof Helper ? () => fn : fn

    try {
      const result = REGISTRY.registry.register(name, reg)

      const host = options.host || options.runtime || options.project

      if (host && options.attach !== false) {
        const helper = REGISTRY.registry.lookup(name)
        helper.attach(host, options)
      }

      Helper.events.emit('registered', { name, options })

      return result
    } catch (error) {
      Helper.events.emit('register:error', { name, error, options })
    }
  }

  /**
   * Creates an instance of the Helper class.  This is usually called via the factory function
   * that gets attached to the runtime when you say Helper.attach, which makes it possible to only
   * specify options but still get context, runtime, and helper class passed automatically.
   *
   * @param {Object} options properties that get attached to the helper instance
   * @param {Object} context context to be passed down from the parent
   * @param {Runtime} runtime the parent runtime that is creating this helper
   * @param {Class} helperClass any subclass of Helper
   */
  static createInstance(options = {}, context = {}, runtime, helperClass = this) {
    helperClass = helperClass || this
    const shortcut = helperClass.shortcut || helperClass.prototype.shortcut

    const helperInstance = new helperClass(
      {
        ...options,
        ...(shortcut ? { shortcut } : {}),
      },
      {
        ...context,
        runtime,
      }
    )

    return helperInstance
  }

  /**
   * Helper classes can specify attributes that individual helper modules are
   * expected to provide or export.
   */
  static providerTypes = {}

  /**
   * Helper classes can specify options or parameters that can be passed in at the time
   * the helper instance is created.
   */
  static optionTypes = {
    id: 'string',
    provider: 'object',
  }

  /**
   * Helpers are always passed a context property from the host project or runtime's sandbox,
   * this will include a reference to the host project, as well as the registry the helper belongs to
   * and things such as the environment or process argv.
   */
  static contextTypes = {
    project: 'object',
    reg: 'object',
    host: 'object',
    runtime: 'object',
  }

  /**
   * Individual helper modules can reference the provdier type configuration from their constructor, and can override
   * them by passing in a providerTypes object in their options, by exporting a providerTypes object themselves.
   *
   * @memberof Helper#
   */
  get providerTypes() {
    return defaults(
      {},
      this.tryResult('providerTypes', {}),
      this.constructor.providerTypes,
      Helper.providerTypes
    )
  }

  /**
   * Individual helper modules can reference the options type configuration from their constructor, and can override
   * them by passing in optionTypes object in their options, by exporting a optionTypes object themselves.
   * @memberof Helper#
   */
  get optionTypes() {
    return defaults(
      {},
      this.tryResult('optionTypes', {}),
      this.constructor.optionTypes,
      Helper.optionTypes
    )
  }

  /**
   * Individual helper modules can reference the context type configuration from their constructor, and can override
   * them by passing in a contextTypes object in their options, by exporting a contextTypes object themselves.
   * @memberof Helper#
   */
  get contextTypes() {
    return defaults(
      {},
      { [this.registryName]: this.constructor.registry },
      this.tryResult('contextTypes', {}),
      this.constructor.contextTypes,
      Helper.contextTypes
    )
  }

  /**
   * Attaching a Helper class to a host, usually an instance of Runtime,
   * will create a factory function that can be used to create Helper instances,
   * as well as a Registry that contains all known providers of the specific Helper class
   * we are attaching.
   *
   * @static
   * @param {Runtime} host
   * @param {Class} helperClass
   * @param {HelperAttachOptions} options
   * @returns {Runtime}
   * @memberof Helper
   */
  static attach(host, helperClass, options) {
    const { isPlainObject } = lodash

    if (isPlainObject(helperClass)) {
      options = helperClass
      helperClass = this
    }

    Helper.events.emit('attach', host, helperClass, options)
    const result = _attach(host, helperClass, options)
    Helper.events.emit('attached', host, helperClass, options)

    return result
  }

  static attachAll(host, options = {}) {
    Helper.events.emit('attachAll', host, options)

    if (!this.isHostValid(host)) {
      throw new Error('Invalid host for the helper registry. pass a project or a portfolio')
    }

    Helper.allHelperTypes.forEach(helperType => {
      if (helperType.isHostSupported && helperType.isHostSupported(host)) {
        helperType.attach(host, options)
      }
    })

    return host
  }

  static isHostSupported(host) {
    return this.isHostValid(host)
  }

  static isHostValid(host) {
    return typeof host.hide === 'function' && typeof host.lazy === 'function'
  }

  static cacheable(setting = true) {
    return (this.isCacheable = !!setting)
  }

  static get allHelpers() {
    return Helper.allHelperTypes
  }

  static get allHelperTypes() {
    return Helper.registry.available
      .map(id => Helper.registry.lookup(id))
      .map(mod => (mod.default ? mod.default : mod))
  }

  static get modules() {
    return Helper
  }

  static createContextRegistry(...args) {
    return new ContextRegistry(...args)
  }

  static createRegistry(...args) {
    return new ContextRegistry(...args)
  }

  /**
   * @abstract
   */
  static willCreateHelper(host, opts) {}

  /**
   * @abstract
   */
  static didCreateHelper(host, helperInstance, opts) {}

  /**
   * @private
   */
  isInitialized = false

  /**
   * Returns the name of this helper
   *
   * @readonly
   * @memberof Helper
   */
  get name() {
    return this._name
  }

  /**
   * A Unique ID for this helper instance
   *
   * @readonly
   * @memberof Helper
   */
  get id() {
    return this._id
  }

  /**
   * @readonly
   * @memberof Helper#
   * @type {Runtime}
   */
  get runtime() {
    return this._runtime
  }

  /**
   * @alias Helper#runtime
   * @deprecated
   */
  get host() {
    return this.runtime
  }

  /**
   * @alias Helper#runtime
   * @deprecated
   */
  get project() {
    return this.runtime
  }

  /**
   * Gets the options this helper was created with
   *
   * @readonly
   * @memberof Helper#
   */
  get options() {
    return this._options
  }

  /**
   * Gets the context this helper was created with
   *
   * @readonly
   * @memberof Helper#
   */
  get context() {
    return this._context
  }

  get provider() {
    return this._provider
  }

  /**
   * Returns the name of the registry this helper will belong to,
   * which can be used to emit global events to helper specific channels
   *
   * @readonly
   * @memberof Helper
   */
  get registryName() {
    return (
      this.constructor.registryName ||
      Helper.propNames(this.constructor.helperName || this.constructor.name).registryProp
    )
  }

  /**
   * Returns a lodash chain object, using this helper instance as the source value
   *
   * @readonly
   * @memberof Helper
   */
  get chain() {
    return lodash.chain(this)
  }

  /**
   * Creates a lazy loading property on an object.
   *
   * @param {String} attribute The property name
   * @param {Function} fn The function that will be memoized
   * @param {Boolean} enumerable Whether to make the property enumerable when it is loaded
   * @return {Helper#}
   */
  lazy(attribute, fn, enumerable = false) {
    return propertyUtils(this).lazy(attribute, fn, enumerable)
  }

  /**
   * creates a non enumerable property on the target object
   *
   * @param {String} attribute
   * @param {*} value
   * @param {Object} options
   * @memberof Helper#
   *
   */
  hide(attribute, value, options = {}) {
    return propertyUtils(this).hide(attribute, value, options)
  }

  /**
   * creates a non enumerable property on the helper
   *
   * @param {String} attribute
   * @param {*} value
   * @param {Object} options
   * @memberof Helper#
   *
   */
  hideProperty(attribute, value, options = {}) {
    return propertyUtils(this).hide(attribute, value, options)
  }

  /**
   * creates multiple non-enumerable properties on the helper
   *
   * @param {Object<string,object>} properties
   * @memberof Helper#
   *
   */
  hideProperties(properties = {}) {
    return propertyUtils(this).hideProperties(properties)
  }
  /**
   * Create a hidden getter property on the object.
   *
   * @param {String} attribute    The name of the property
   * @param {Function} fn      A function to call to return the desired value
   * @param {Object} [options={}]
   * @param {Object} [options.scope=this]
   * @param {Array} [options.args=[]] arguments that will be passed to the function
   * @memberof Helper#
   * @return {Helper#}
   */
  hideGetter(attribute, fn, options = {}) {
    return propertyUtils(this).hideGetter(attribute, fn, options)
  }

  /**
   * Create a hidden getter property on the object.
   *
   * @param {String} attribute    The name of the property
   * @param {Function} fn      A function to call to return the desired value
   * @param {Object} [options={}]
   * @param {Object} [options.scope=this]
   * @param {Array} [options.args=[]] arguments that will be passed to the function
   * @memberof Helper#
   * @return {Helper}
   */
  getter(attribute, fn, options = {}) {
    return propertyUtils(this).getter(attribute, fn, options)
  }

  /**
   * @param {Mixin} methods - an object of functions that will be applied to the target
   * @param {MixinOptions} options - options for the mixin attributes
   */
  applyInterface(methods = {}, options = {}) {
    return propertyUtils(this).applyInterface(methods, options)
  }

  at(...paths) {
    return lodash.at(this, ...paths)
  }

  set(path, value) {
    return lodash.set(this, path, value)
  }

  get(path, defaultValue) {
    return lodash.get(this, path, defaultValue)
  }

  result(path, defaultValue, ...args) {
    return lodash.result(this, path, defaultValue, ...args)
  }

  has(path) {
    return lodash.has(this, path)
  }

  invoke(...args) {
    return lodash.invoke(this, ...args)
  }

  pick(...args) {
    return lodash.pick(this, ...args)
  }

  get lodash() {
    return lodash
  }

  get helperEvents() {
    return Helper.events
  }

  get isCached() {
    return !!this.get('options.cacheable') && (this.cacheKey && this.cacheKey.length > 0)
  }

  get cacheKey() {
    return this.get('options.cacheKey')
  }

  /** */
  async doInitialize() {
    const initializer = this.tryGet('initialize', this.initialize)
    this.fireHook('beforeInitialize')

    if (initializer) {
      await Promise.resolve(initializer.call(this, this.options, this.context))
      this.hide('isInitialized', true)
    }

    this.fireHook('afterInitialize')
    return this
  }

  /**
   * Sets the initial state of the object.  This is called in the Helper constructor
   *
   * @private
   */
  setInitialState(initialState = this.initialState || {}) {
    const { defaultsDeep } = this.lodash

    if (this.state && this.tryGet('initialState')) {
      return Promise.resolve(this.attemptMethodAsync('initialState'))
        .then(i => {
          if (typeof i === 'object') {
            this.state.merge(defaultsDeep({}, i, initialState))
          }
        })
        .catch(error => {
          console.error('Error setting initial state', this, error)
          this.initialStateError = error
        })
    }
  }

  fireHook(hookName, ...args) {
    this.helperEvents.emit(`${this.registryName}:${hookName}`, this, ...args)
    this.emit(hookName, ...args)
    this.emit('firingHook', hookName, ...args)
    this.attemptMethod(hookName, { args })
  }

  /**
   * Access the first value we find in our options hash in our provider hash
   *
   * @param {String} objectPath the dot.path to the property
   * @param {*} [defaultValue] the default value
   * @param {Array<String>} sources property paths to search
   * @returns {*}
   * @memberof Helper
   */
  tryGet(
    objectPath,
    defaultValue,
    sources = [
      'options',
      'provider',
      'provider.default.prototype',
      'provider.default',
      'provider.prototype',
    ]
  ) {
    const values = this.at(...sources.map(s => `${s}.${objectPath}`)).filter(v => !isUndefined(v))

    return values.length ? values[0] : defaultValue
  }

  /**
   * Access the first value we find in our options hash in our provider hash
   *
   * If the method is a function, it will be called in the scope of the helper,
   * with the helpers options and context
   *
   * @param {String} objectPath the dot.path to the property
   * @param {*} defaultValue the default value
   * @param {Object} options options object which will be passed to the property if it is a function
   * @param {Object} context context object which will be passed to the property if it is a function
   * @returns {*}
   * @memberof Helper
   */
  tryResult(property, defaultValue, options = {}, context = {}) {
    const val = this.tryGet(property)

    if (!val) {
      return typeof defaultValue === 'function'
        ? defaultValue.call(this, { ...this.options, ...options }, { ...this.context, ...context })
        : defaultValue
    } else if (typeof val === 'function') {
      return val.call(this, { ...this.options, ...options }, { ...this.context, ...context })
    } else {
      return val
    }
  }

  // Merge the objects found at k starting with at options, provider, runtimeSettings
  mergeGet(key, namespaces = ['options', 'provider', 'runtimeSettings']) {
    key = typeof key === 'string' ? key.split('.') : key
    key = flatten(castArray(key))

    return defaults({}, ...namespaces.map(n => this.get([n, ...key])))
  }

  // Merge the objects found at k starting with at options, provider, runtimeSettings
  // If the property is a function, it will be called in the scope of the helper, with the helpers options and context
  mergeResult(key, namespaces = ['options', 'provider', 'runtimeSettings']) {
    key = typeof key === 'string' ? key.split('.') : key
    key = flatten(castArray(key))

    const ifFunc = v => (typeof v === 'function' ? v.call(this, this.options, this.context) : v)

    return defaults({}, ...namespaces.map(n => this.get([n, ...key])).map(ifFunc))
  }

  slice(...properties) {
    return lodash.zipObjectDeep(properties, this.at(properties))
  }

  static registryName() {
    return Helper.propNames(this.name).registryProp
  }

  static createMixin(methods = {}, target, ...partialArgs) {
    const functions = pickBy(methods, isFunction)
    const partialed = mapValues(functions, fn => partialRight(fn.bind(target), ...partialArgs))

    return mapValues(partialed, boundFn => (options = {}, ...args) => boundFn(options, ...args))
  }

  createMixin(methods = {}, context = this.context, target = this) {
    console.warn('createMixin is deprecated')
    const functions = pickBy(methods, isFunction)
    const partialed = mapValues(functions, fn => partialRight(fn.bind(target), context))

    return mapValues(partialed, boundFn => (options = {}, ...args) => boundFn(options, ...args))
  }

  applyMixin(methods = this.provider, context = this.context, target) {
    console.warn('applyMixin is deprecated')
    return Object.assign(this, this.createMixin(methods, context, target))
  }

  mixin(object = {}, options = {}) {
    this.applyInterface(object, {
      transformKeys: true,
      scope: this,
      partial: [this.context],
      right: true,
      insertOptions: false,
      hidden: false,
      ...options,
    })

    return this
  }

  attemptMethod(methodName, ...args) {
    const handler = this.tryGet(methodName, this[methodName])

    if (typeof handler === 'undefined') {
      if (this.runtime.isDevelopment && this.runtime.get('environment.DEBUG_HELPERS')) {
        this.runtime.debug(`attemptMethod called on non-existent method: ${methodName} `, {
          name: this.name,
          id: this.id,
        })
      }

      return false
    }

    if (typeof handler === 'function') {
      if (args.length === 0) {
        args.unshift({})
      }
      args.push(this.context)

      try {
        return handler.call(this, ...args)
      } catch (error) {
        return false
      }
    }

    return handler
  }

  attemptMethodAsync(name, ...args) {
    const result = this.attemptMethod(name, ...args)
    return Promise.resolve(result || null)
  }

  callMethod(methodName, ...args) {
    const handler = this.tryGet(methodName, this[methodName])

    if (typeof handler !== 'function') {
      throw new Error(`Could not find a property at ${methodName}`)
    }

    if (args.length === 0) {
      args.unshift({})
    }

    return handler.call(this, ...[...args, this.context])
  }

  get invalidOptionKeys() {
    return this.chain
      .get('options')
      .omit(Object.keys(this.optionTypes))
      .keys()
      .value()
  }

  get invalidContextKeys() {
    return this.chain
      .get('context')
      .omit(Object.keys(this.contextTypes))
      .keys()
      .value()
  }

  get argv() {
    return omit(this.get('runtime.argv', this.get('host.argv', {})), '_', '')
  }

  get defaultOptions() {
    return defaultsDeep({}, this.argv, this.runtimeSettings)
  }

  get runtimeSettings() {
    const name = this.name || this.id
    const cased = camelCase(snakeCase(name))
    const { omit } = this.lodash

    const { projectSettingsPaths = [] } = this
    return omit(defaultsDeep({}, ...this.at(projectSettingsPaths)), name, cased)
  }

  /**
   * The object search paths where we look for settings and configuration
   *
   * @readonly
   * @memberof Helper
   */
  get projectSettingsPaths() {
    const groupName = this.constructor.registryName()
    const name = this.name || this.id

    return [
      `runtime.argv.${groupName}.${name}`,
      `runtime.options.${groupName}.${name}`,
      `runtime.settings.${groupName}.${name}`,
      `runtime.argv.${groupName}.${camelCase(snakeCase(name))}`,
      `runtime.options.${groupName}.${camelCase(snakeCase(name))}`,
      `runtime.settings.${groupName}.${camelCase(snakeCase(name))}`,
    ].map(str => str.replace(/(\\|\/)/g, '.'))
  }

  static propNames(name = '') {
    return {
      registryProp: camelCase(pluralize(snakeCase(name))),
      lookupProp: singularize(camelCase(snakeCase(name))),
    }
  }

  static createMockContext = createMockContext
}

export default Helper

export function createMockContext(object = {}) {
  const fn = key =>
    result(object, key, () => {
      throw new Error(`Module ${key} not found in mock context`)
    })

  return Object.assign(fn, {
    keys() {
      return keys(object)
    },
    resolve(key) {
      const resolved = has(object, key) && key

      if (resolved) {
        return resolved
      } else {
        throw new Error(`Module ${key} not found in mock context`)
      }
    },
  })
}
export const registry = Helper.registry
export const registerHelper = Helper.registerHelper
export const createContextRegistry = (name, ...args) => new ContextRegistry(name, ...args)

const attach = Helper.attach

export { attach, ContextRegistry }

export function _attach(host, helperClass, options = {}) {
  const { registryProp, lookupProp, configKey = 'options' } = {
    ...Helper.propNames(helperClass.name),
    ...options,
  }

  const originalHelperClass = helperClass

  if (host[registryProp]) {
    return host
  }

  if (host.fireHook) {
    host.fireHook('willAttachHelpers', registryProp, helperClass, options)
  }

  lazy(host, registryProp, () => options.registry || helperClass.createRegistry())

  // ensures that we can always access the function
  hideProperty(host[registryProp], 'createHelperByName', (name, opts = {}, ctx = {}) => {
    if (typeof name !== 'string') {
      name = `${lookupProp}${lodash.uniqueId()}`
    }

    const reg = host[registryProp]

    const { cacheHelper = !!(helperClass.isCacheable || opts.cacheHelper) } = opts

    opts = defaults(
      {},
      opts,
      { name, id: name, cacheHelper: !!helperClass.isCacheable },
      omit(host.argv, '', '_'),
      host.get(`${configKey}.${registryProp}.${name}`),
      host.get(`${configKey}.${registryProp}.${camelCase(snakeCase(name))}`)
    )

    const helperContext = { ...host.createSandbox(ctx), host, reg, [registryProp]: reg }

    let provider

    try {
      provider = reg.lookup(name)
    } catch (error) {
      if (helperClass.allowAnonymousProviders || options.allowAnonymousProviders) {
        provider = opts.provider || Object.assign({}, { name }, opts)
      } else {
        throw error
      }
    }

    if (
      provider &&
      provider.default &&
      typeof provider.default === 'function' &&
      provider.default.isSkypagerHelper
    ) {
      helperClass = provider.default
      opts.shortcut = getShortcut(opts, helperClass)
    } else if (provider && typeof provider === 'function' && provider.isSkypagerHelper) {
      helperClass = provider
      opts.shortcut = getShortcut(opts, helperClass)
    } else {
      helperClass = originalHelperClass
    }

    const cacheable = !!(
      cacheHelper !== false &&
      provider.isCacheable !== false &&
      provider.cacheable !== false &&
      typeof host.cache !== 'undefined'
    )
    const cacheKey = [registryProp, hashObject(omitBy(opts, cacheableKeys)), name].join(':')

    opts.cacheKey = cacheKey
    opts.cacheable = cacheable
    opts.provider = provider

    opts.shortcut =
      opts.shortcut ||
      provider.shortcut ||
      (helperClass.prototype && helperClass.prototype.shortcut) ||
      helperClass.shortcut
    opts.createGetter =
      opts.createGetter || provider.createGetter || opts.createGetter || opts.shortcut

    // type case the values true, false, TRUE, FALSE
    keys(opts).forEach(key => {
      if (typeof opts[key] === 'string' && opts[key].match(/true|false/i)) {
        opts[key] = opts[key].toLowerCase() === 'true'
      }
    })

    if (host.willCreateHelper) {
      const response = host.willCreateHelper(opts, helperClass)

      if (response === false) {
        return false
      }
    }

    if (helperClass.willCreateHelper(host, opts) === false) {
      return false
    }

    const helperInstance = cacheable
      ? host.cache.fetch(cacheKey, () =>
          helperClass.createInstance(opts, helperContext, host, helperClass)
        )
      : helperClass.createInstance(opts, helperContext, host, helperClass)

    if (opts.createGetter || opts.shortcut) {
      host.lazy(opts.createGetter || opts.shortcut, () => helperInstance, true)
    }

    helperInstance.hide('destroyHelper', () => {
      try {
        helperInstance.removeAllListeners()
        host.cache.delete(cacheKey)
      } catch (e) {}

      helperInstance.fireHook('willBeDestroyed', helperInstance, host, opts)
      return true
    })

    if (host.didCreateHelper) {
      host.didCreateHelper(helperInstance, opts)
    }

    helperClass.didCreateHelper(host, helperInstance, opts)

    if (
      helperClass.isObservable ||
      provider.isObservable ||
      provider.observables ||
      opts.observables ||
      helperClass.observables ||
      (helperClass.prototype && helperClass.prototype.observables)
    ) {
      host.fireHook('didCreateObservableHelper', helperInstance, helperClass)
    }

    return helperInstance
  })

  hideProperty(host[registryProp], 'allInstances', (options = {}) =>
    Object.keys(host[registryProp].allMembers()).map(id => host[lookupProp](id, options))
  )

  hideProperty(
    host[registryProp],
    'createLookup',
    (defaultOptions = {}, cacheHelper = helperClass.isCacheable) => (id, options = {}, ...args) =>
      host[registryProp].createHelperByName(
        id,
        { ...defaultOptions, cacheHelper, ...options },
        ...args
      )
  )

  host.hideGetter(lookupProp, () => {
    const baseFn = (...args) => host[registryProp].createHelperByName(...args)
    const { camelCase, lowerFirst, kebabCase } = lodash

    host.get([registryProp, 'available']).forEach(helperId => {
      const parts = helperId.split('/').map(p => lowerFirst(camelCase(kebabCase(p))))
      lodash.set(baseFn, parts, (...rest) => {
        return baseFn(helperId, ...rest)
      })
    })

    return baseFn
  })

  if (host.didAttachHelpers) {
    host.didAttachHelpers.call(host, helperClass, options)
  }

  return host
}

// will not use the key if this function returns true
const cacheableKeys = (value = {}, key) =>
  isFunction(value) ||
  (value && value.then && isFunction(value.then)) ||
  key == 'provider' ||
  key === 'compiler'

const getShortcut = (opts = {}, helperClass) => {
  const shortcut =
    lodash.result(opts, 'shortcut', () => lodash.result(opts, 'createGetter')) ||
    lodash.result(helperClass, 'shortcut', () => lodash.result(helperClass, 'createGetter')) ||
    lodash.result(helperClass.prototype, 'shortcut', () =>
      lodash.result(helperClass.prototype, 'createGetter')
    )

  if (shortcut) {
    return shortcut
  }

  const desc = Object.getOwnPropertyDescriptor(helperClass, 'shortcut') || {}

  return lodash.result(desc, 'value')
}
