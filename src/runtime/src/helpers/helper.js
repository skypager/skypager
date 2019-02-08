/**
 * @class       Helper
 * @classdesc   Helpers act as a registry for specific types of Javascript modules
 *              that are to be made available to a project runtime.  Helpers exist to provide
 *              common behavior, interfaces, and life cycle events and hooks for all types of things
 *              such as servers, compilers, commands, or anything else that can be categorized and grouped.
 *              Helpers are designed to be shared across multiple projects, and there are event Project Type helpers
 *              which exist to make specific types of helpers available to specific types of projects.
 */

import lodash from 'lodash'
import { hashObject, hideProperty, lazy, enhanceObject } from '../utils/properties'
import { camelCase, snakeCase, singularize, pluralize } from '../utils/string'
import ContextRegistry from '../registries/context'
import { attach as attachEmitter } from '../utils/emitter'

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

export class Helper {
  static isSkypagerHelper = true

  static helperName = 'Helper'

  static registry = REGISTRY

  static ContextRegistry = ContextRegistry

  static ContextError = ContextError

  static OptionsError = OptionsError

  static ContextError = ContextError

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

  static createInstance(options = {}, context = {}, runtime, helperClass) {
    helperClass = helperClass || this
    const helperInstance = new helperClass(
      {
        shortcut: helperClass.shortcut || helperClass.prototype.shortcut,
        ...options,
      },
      context
    )

    /*
    runtime.debug("Helper Instance Created", {
      helperClass: helperClass.name,
      instanceName: helperInstance.name,
      cacheKey: helperInstance.cacheKey,
      uuid: helperInstance.uuid,
    })
    */

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
   * A Helper class is attached to a host.
   */
  static attach(host, helperClass, options) {
    Helper.events.emit('attach', host, helperClass, options)
    const result = attach(host, helperClass, options)
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

  static willCreateHelper(host, opts) {}

  static didCreateHelper(host, helperInstance, opts) {}

  static _decorateProvider(providerModule, helperInstance) {
    if (this.decorateProvider) {
      return this.decorateProvider(providerModule, helperInstance)
    } else {
      return providerModule
    }
  }

  isInitialized = false
  isConfigured = false

  constructor(options = {}, context = {}) {
    enhanceObject(
      this,
      {
        includeLodashMethods: false,
        includeChain: true,
      },
      lodash
    )

    attachEmitter(this)

    options.provider = options.provider || {}

    /**
     * @property {string} name - the name for this helper
     */
    !this.name && this.lazy('name', options.name)

    /**
     * @property {string} uuid - a unique id for this helper instance
     */
    !this.uuid && this.hide('uuid', options.uuid || require('uuid')())

    /**
     * @property {object} context - the helper context
     */
    this.hide('context', context)

    try {
      this.hideGetter(`is${this.constructor.helperName || this.constructor.name}`, () => true)
    } catch (error) {}

    /**
     * @property {string} registryName - the default name for the registry of helper modules
     */
    this.hide(
      'registryName',
      this.constructor.registryName ||
        Helper.propNames(this.constructor.helperName || this.constructor.name).registryProp
    )

    /**
     * @property {Runtime} project - a reference to the runtime that created this helper
     */

    this.hideGetter('project', () => context.project || context.host || context.runtime)

    /**
     * @property {Runtime} host - a reference to the runtime that created this helper
     */

    this.hideGetter('host', () => context.project || context.host || context.runtime)

    /**
     * @property {Runtime} runtime - a reference to the runtime that created this helper
     */
    this.hideGetter('runtime', () => context.project || context.host || context.runtime)

    if (this.runtime.beforeHelperCreate) {
      this.runtime.beforeHelperCreate.call(this.runtime, this, options, context, this.constructor)
    }

    this.getter('options', () => omit({ ...this.defaultOptions, ...options }, 'provider'))
    this.hide('provider', this.constructor._decorateProvider(options.provider, this))

    this.lazy('id', () =>
      [
        this.get('project.id', this.constructor.name),
        options.name,
        Math.floor(new Date() / 100),
      ].join(':')
    )

    if (options.initialize !== false) {
      this.doInitialize()
    }

    this.hide('configureWith', (...a) => {
      console.log('> configWith is deprecated!')
      console.trace()
      return this.conifgure(...a)
    })
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
   * @param {*} defaultValue the default value
   * @param {Array<String>} sources property paths to search
   * @returns {*}
   * @memberof Helper
   */
  tryGet(
    property,
    defaultValue,
    sources = [
      'options',
      'provider',
      'provider.default.prototype',
      'provider.default',
      'provider.prototype',
    ]
  ) {
    const values = this.at(...sources.map(s => `${s}.${property}`)).filter(v => !isUndefined(v))

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

  get argv() {
    return omit(this.get('runtime.argv', this.get('host.argv', {})), '_', '')
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

export { ContextRegistry }

export function attach(host, helperClass, options = {}) {
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
