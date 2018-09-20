/**
 * @name        Helper
 * @description Helpers act as a registry for specific types of Javascript modules
 *              that are to be made available to a project runtime.  Helpers exist to provide
 *              common behavior, interfaces, and life cycle events and hooks for all types of things
 *              such as servers, compilers, commands, or anything else that can be categorized and grouped.
 *              Helpers are designed to be shared across multiple projects, and there are event Project Type helpers
 *              which exist to make specific types of helpers available to specific types of projects.
 */

import lodash from 'lodash'
import { hashObject, hideProperty, lazy, enhanceObject } from '../utils/properties'
import { camelCase, snakeCase, camelize, underscore, singularize, pluralize } from '../utils/string'
import ContextRegistry from '../registries/context'
import configBuilder from '../config-builder'
import { attach as attachEmitter } from '../utils/emitter'

const utils = require('./util')
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
  zipObjectDeep,
} = lodash

const req = require.context('./helpers', false, /DISABLED\.js$/)

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
    const helperInstance = new helperClass(options, context)

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
    enhanceObject(this, lodash)
    attachEmitter(this)

    options.provider = options.provider || {}

    this.lazy(
      'name',
      () => this.get('options.name', this.result('provider.name', () => options.name)),
      true
    )

    this.hide('uuid', require('uuid')())

    this.hide('context', context)

    try {
      this.hideGetter(`is${this.constructor.name}`, () => true)
    } catch (error) {}

    this.hide('registryName', Helper.propNames(this.constructor.name).registryProp)

    // these are all aliases
    this.hideGetter('project', () => context.project || context.host || context.runtime)
    this.hideGetter('host', () => context.project || context.host || context.runtime)
    this.hideGetter('runtime', () => context.project || context.host || context.runtime)

    if (this.project.beforeHelperCreate) {
      this.project.beforeHelperCreate.call(this.project, this, options, context, this.constructor)
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

    this.hide('configHistory', [], false)

    if (options.initialize !== false) {
      this.doInitialize()
    }

    this.hide('configureWith', (...a) => {
      console.log('> configWith is deprecated!')
      console.trace()
      return this.conifgure(...a)
    })
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

  fireHook(hookName, ...args) {
    this.helperEvents.emit(`${this.registryName}:${hookName}`, this, ...args)
    this.emit(hookName, ...args)
    this.emit('firingHook', hookName, ...args)
    this.attemptMethod(hookName, { args })
  }

  /**
   * Access the first value we find in our options hash in our provider hash
   */
  tryGet(property, defaultValue, sources = ['options', 'provider']) {
    return (
      this.at(...sources.map(s => `${s}.${property}`)).find(v => !isUndefined(v)) || defaultValue
    )
  }

  /**
   * Access the first value we find in our options hash in our provider hash
   *
   * If the method is a function, it will be called in the scope of the helper,
   * with the helpers options and context
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

  // Merge the objects found at k starting with at options, provider, projectConfig
  mergeGet(key, namespaces = ['options', 'provider', 'projectConfig']) {
    key = typeof key === 'string' ? key.split('.') : key
    key = flatten(castArray(key))

    return defaults({}, ...namespaces.map(n => this.get([n, ...key])))
  }

  // Merge the objects found at k starting with at options, provider, projectConfig
  // If the property is a function, it will be called in the scope of the helper, with the helpers options and context
  mergeResult(key, namespaces = ['options', 'provider', 'projectConfig']) {
    key = typeof key === 'string' ? key.split('.') : key
    key = flatten(castArray(key))

    const ifFunc = v => (typeof v === 'function' ? v.call(this, this.options, this.context) : v)

    return defaults({}, ...namespaces.map(n => this.get([n, ...key])).map(ifFunc))
  }

  static configFeatures() {
    return {}
  }

  static configReducers() {
    return {}
  }

  static configPresets() {
    return {}
  }

  slice(...properties) {
    return lodash.zipObjectDeep(properties, this.at(properties))
  }

  getConfigPresetsObject(passed = {}) {
    let providers = this.get('provider.configPresets', function() {})
    let options = this.get('options.configPresets', function() {})
    let constructors = this.get('constructor.configPresets', function() {})

    providers = isFunction(providers)
      ? providers.call(this, this.options, this.context)
      : providers || {}

    options = isFunction(options) ? options.call(this, this.options, this.context) : options || {}

    constructors = isFunction(constructors)
      ? constructors.call(this, this.options, this.context)
      : constructors || {}

    return defaults({}, passed, options, providers, constructors)
  }

  getConfigPresets() {
    const base = omitBy(this.getConfigPresetsObject(), v => !isFunction(v))
    return mapValues(base, fn => fn.bind(this))
  }

  getConfigFeaturesObject(passed = {}) {
    let providers = this.get('provider.configFeatures', function() {})
    let options = this.get('options.configFeatures', function() {})
    let constructors = this.get('constructor.configFeatures', function() {})

    providers = isFunction(providers)
      ? providers.call(this, this.options, this.context)
      : providers || {}

    options = isFunction(options) ? options.call(this, this.options, this.context) : options || {}

    constructors = isFunction(constructors)
      ? constructors.call(this, this.options, this.context)
      : constructors || {}

    return defaults({}, passed, options, providers, constructors)
  }

  getConfigFeatures() {
    const base = omitBy(this.getConfigFeaturesObject(), v => !isFunction(v))
    return mapValues(base, fn => fn.bind(this))
  }

  getConfigReducersObject() {
    let providers = this.get('provider.configReducers', function() {})
    let options = this.get('options.configReducers', function() {})
    let constructors = this.get('constructor.configReducers', function() {})

    providers = isFunction(providers) ? providers.call(this, this.options, this.context) : providers
    options = isFunction(options) ? options.call(this, this.options, this.context) : options
    constructors = isFunction(constructors)
      ? constructors.call(this, this.options, this.context)
      : constructors

    return mapValues(defaults({}, options, providers, constructors), fn => fn.bind(this))
  }

  getConfigReducers() {
    const base = omitBy(this.getConfigReducersObject(), v => !isFunction(v))
    return mapValues(base, fn => fn.bind(this))
  }

  configurator(options = {}) {
    if (this.builder) {
      return this.builder
    }

    const {
      baseConfig = this.tryGet('baseConfig', {}),
      scope = this,
      tap = this.tryGet('tapConfig'),
    } = options

    const features = this.getConfigFeaturesObject(options.features)
    const reducers = this.getConfigReducersObject(options.reducers)
    const presets = this.getConfigPresetsObject(options.presets)

    return configBuilder.call(this, {
      features,
      reducers,
      presets,
      history: this.configHistory,
      scope,
      tap,
      baseConfig,
      keyFn: this.configKeysFn,
      onStash: (...a) => this.emit('config:stashed', ...a),
      onReset: (...a) => this.emit('config:reset', ...a),
    })
  }

  get configKeysFn() {
    return (
      this.at(
        'options.mapConfigKeys',
        'provider.mapConfigKeys',
        'constructor.mapConfigKeys',
        'options.transformConfigKeys',
        'provider.transformConfigKeys',
        'constructor.transformConfigKeys'
      ).find(f => typeof f === 'function') || ((v, k) => pluralize(k))
    )
  }

  configure(fn = c => c) {
    this.lazy('builder', () => fn(this.configurator()), false)
    this.configHistory.push(this.builder.history)
    return this
  }

  get currentConfig() {
    console.log('currentConfig is deprecated')
    console.trace()
    return this.config
  }

  get config() {
    return this.configurator().getConfig()
  }

  stringifyConfig() {
    return this.config.toString()
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
    const handler = this.tryGet(methodName, this.get(methodName))

    if (typeof handler === 'undefined') {
      if (this.project.isDevelopment && this.project.get('environment.DEBUG_HELPERS')) {
        this.project.debug(`attemptMethod called on non-existent method: ${methodName} `, {
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
    const result = this.attemptMethod.call(this, name, ...args)
    return Promise.resolve(result || null)
  }

  callMethod(methodName, ...args) {
    const handler = this.tryGet(methodName)

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
    return defaultsDeep({}, this.argv, this.projectConfig)
  }

  get projectOptions() {
    return this.projectConfig
  }

  get projectConfig() {
    const name = this.name || this.id
    const cased = camelCase(snakeCase(name))
    const { omit } = this.lodash

    const { projectConfigKeys = [] } = this
    return omit(defaultsDeep({}, ...this.at(projectConfigKeys)), name, cased)
  }

  get projectConfigKeys() {
    const groupName = this.constructor.registryName()
    const name = this.name || this.id

    return [
      `runtime.argv.${groupName}.${name}`,
      `runtime.options.${groupName}.${name}`,
      `runtime.config.${groupName}.${name}`,
      `runtime.argv.${groupName}.${camelCase(snakeCase(name))}`,
      `runtime.options.${groupName}.${camelCase(snakeCase(name))}`,
      `runtime.config.${groupName}.${camelCase(snakeCase(name))}`,
    ]
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

  static createHost(...args) {
    const host = utils.createHost(...args)

    Helper.attachAll(host)

    return host
  }

  static createMockContext(object = {}) {
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
}

export default Helper

export const createHost = Helper.createHost
export const createMockContext = Helper.createMockContext
export const registry = Helper.registry
export const registerHelper = Helper.registerHelper
export const createContextRegistry = (name, ...args) => new ContextRegistry(name, ...args)

export { ContextRegistry }

export function attach(host, helperClass, options = {}) {
  const { registryProp, lookupProp, configKey = 'options' } = {
    ...Helper.propNames(helperClass.name),
    ...options,
  }

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

    if (provider.shortcut) opts.shortcut = opts.shortcut || provider.shortcut
    if (provider.createGetter) opts.createGetter = opts.createGetter || provider.createGetter

    // type case the values true, false, TRUE, FALSE
    keys(opts).forEach(key => {
      if (typeof opts[key] === 'string' && opts[key].match(/true|false/i)) {
        opts[key] = opts[key].toLowerCase() === 'true'
      }
    })

    if (host.willCreateHelper) {
      const response = host.willCreateHelper.call(host, opts)

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
      host.didCreateHelper.call(host, helperInstance, opts)
    }

    helperClass.didCreateHelper(host, helperInstance, opts)

    if (
      helperClass.isObservable ||
      provider.isObservable ||
      provider.observables ||
      opts.observables ||
      helperClass.observables
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
