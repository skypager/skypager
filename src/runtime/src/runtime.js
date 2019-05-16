import '@babel/polyfill/noConflict'
import lodash from 'lodash'
import * as mobx from 'mobx'
import { basename, dirname, join, parse, relative, resolve, sep } from 'path'
import { parse as parseQueryString } from 'querystring'
import { format as formatUrl, parse as parseUrl } from 'url'
import uuid from 'uuid'
import Cache from './cache'
import { Feature } from './feature'
import ProfilerFeature from './features/profiler'
import VmFeature from './features/vm'
import { Helper } from './helper'
import { attachEmitter } from './utils/emitter'
import mware from './utils/mware'
import * as propUtils from './utils/properties'
import * as stringUtils from './utils/string'
import WeakCache from './weak-cache'

const { propertyUtils } = propUtils

export { propUtils, stringUtils, Helper, Feature }

export const observableMap = mobx.observable.map
export const urlUtils = { parseUrl, formatUrl, parseQueryString }
export const pathUtils = { join, parse, resolve, sep, basename, dirname, relative }

export const ContextRegistry = Helper.ContextRegistry

export const registerHelper = Helper.registerHelper
export const createRegistry = Helper.createRegistry
export const helpers = Helper.registry
export const features = Feature.registry
export const events = attachEmitter({})

const { camelCase, snakeCase } = stringUtils
const { hashObject, createEntity: entity, hide, enhanceObject } = propUtils
const { observe, extendObservable, observable, toJS, computed, action, autorun } = mobx

const selectorCache = new WeakMap()

const {
  result,
  keys,
  pick,
  get,
  isFunction,
  omitBy,
  mapValues,
  toPairs,
  zipObjectDeep,
  uniq,
  castArray,
  defaultsDeep: defaults,
  isArray,
  isObject,
  isUndefined,
  flatten,
} = lodash

let runtimesRegistry
let frameworkRuntime

let singleton

const windowIsAvailable = typeof window !== 'undefined'
const documentIsAvailable = typeof document !== 'undefined'
const processIsAvailable = typeof process !== 'undefined'

const defaultOptions = result(global, 'SkypagerDefaultOptions', {})
const defaultContext = result(global, 'SkypagerDefaultContext', {})
const contextTypes = result(global, 'SkypagerContextTypes', {})
const optionTypes = result(global, 'SkypagerOptionTypes', {})

const enableStrictMode = get(
  global,
  'process.env.SKYPAGER_STRICT_MODE',
  get(global, 'SkypagerStrictMode', false)
)

/**
 * @typedef {Object<string, function>} Mixin
 */

/**
 *
 * @typedef {Object<string>} MixinOptions
 * @prop {Array} partial - an array of objects to be passed as arguments to the function
 * @prop {Boolean} right - whether to append the arguments
 * @prop {Boolean} insertOptions - whether to pass an empty object as the first arg automatically
 * @prop {Boolean} hidden - make the property non-enumerable
 * @prop {Boolean} configurable - make the property non-configurable
 */

/**
 *
 * @typedef {Object} Logger
 * @prop {Function} log
 * @prop {Function} info
 * @prop {Function} debug
 * @prop {Function} warn
 * @prop {Function} error
 */

/**
 * @mixin Stateful
 * @property {Map} state
 * @property {Object} currentState
 * @property {Function} setState
 * @property {Function} replaceState
 * @property {String} cacheKey
 * @property {String} stateHash
 */

/**
 * Create a new instance of the skypager.Runtime
 *
 * @class Runtime
 * @classdesc The Runtime is similar to the window or document global in the browser, or the module / process globals in node.
 * You can extend Runtime and define your own process global singleton that acts as a state machine, event emitter,
 * module registry, dependency injector.  Typically you can just do this with features instead of subclassing.
 * @mixes Stateful
 * @param {object} [options] - the props, or argv, for the runtime instance at the time it is created
 * @param {object} [context] - the context, environment, static config, or similar global values that may be relevant to some component in the runtime
 * @param {function} [middlewareFn] - this function will be called when the runtime is asynchronously loaded and the plugins have run *
 */
export class Runtime {
  displayName = 'Skypager'

  constructor(options = {}, context = {}, middlewareFn) {
    if (isFunction(options)) {
      middlewareFn = options
      options = {}
      context = context || {}
    }

    if (isFunction(context)) {
      middlewareFn = context
      context = {}
    }

    enhanceObject(
      this,
      { propUtils: false, includeLodashMethods: false, includeChain: false },
      lodash
    )

    attachEmitter(this)

    extendObservable(this, {
      state: observable.shallowMap(toPairs(this.initialState)),
      currentState: computed(this.getCurrentState.bind(this)),
      stateHash: computed(this.getStateHash.bind(this)),
      cacheKey: computed(this.getCacheKey.bind(this)),
      setState: action(this.setState.bind(this)),
      replaceState: action(this.replaceState.bind(this)),
      featureStatus: observable.shallowMap([]),
    })

    const cwd = result(options, 'cwd', () =>
      !isUndefined(process) ? result(process, 'cwd', '/') : '/'
    )

    this.hideProperties({
      _logger: console,
      _parent: context.parent || singleton,
      _cwd: cwd,
      _uuid: uuid(),
      _name: options.name || camelCase(snakeCase(cwd.split('/').pop())),
      _cache: new Cache(options.cacheData || []),
      _weakCache: new WeakCache(options.cacheData || []),
      rawOptions: options,
      rawContext: context,
      _enabledFeatures: {},
      middlewares: { [STARTING]: mware(this), [PREPARING]: mware(this) },
      _registries: new ContextRegistry('registries', {
        context: Helper.createMockContext({}),
      }),
      _selectors: new ContextRegistry('selectors', {
        context: Helper.createMockContext({}),
      }),
    })

    let { start, initialize, prepare } = this

    if (isFunction(options.initialize))
      initialize = lodash.flow(
        this.initialize,
        options.initialize
      )

    if (isFunction(options.prepare))
      prepare = lodash.flow(
        this.prepare,
        options.prepare
      )

    this.initialize = initializeSequence.bind(this, this, initialize)
    this.prepare = prepareSequence.bind(this, this, prepare)
    this.start = startSequence.bind(this, this, start)

    this.events.emit('runtimeWasCreated', this, this.constructor)
    this.applyRuntimeInitializers()

    // autoAdd refers to require.contexts that should be added to our registries
    // this step is deferred until all helpers have been attached.
    this.constructor.autoAdd.forEach(item => {
      const { type, ctx } = item
      this.invoke(`${type}.add`, ctx)
    })

    this.attachAllHelpers()

    Feature.attach(this)

    this.features.register('profiler', () => ({ default: ProfilerFeature }))
    this.features.register('vm', () => VmFeature)
    this.enableFeatures(this.autoEnabledFeatures)

    if (typeof middlewareFn === 'function') {
      this.use(middlewareFn.bind(this), INITIALIZING)
    }

    if (this.autoInitialize) this.initialize()
  }

  /**
   * Extend the runtime with a middleware function, plugin object, or helper class.
   *
   * @example chain them as necessary
   *
   * runtime
   *  .use((next) => { })
   *  .use({ attach(runtime) { } })
   *  .use(MyFeature)
   *  .use('some-feature-thats-been-registered')
   *
   * @example using a function, deferred until runtime.start() is called
   *
   * runtime.use((next) => {
   *  doSomethingAsync().then(() => next()).catch((error) => next(error))
   * })
   *
   * @example using a plugin object with an attach function
   *
   * runtime.use({
   *  attach(runtime) {
   *    console.log('runs immediately')
   *    runtime.use((next) => {
   *      console.log('called at runtime start() like normal')
   *    })
   *  }
   * })
   *
   * @example specifying the PREPARING stage to run before any starting middlewares are called
   *
   * runtime
   *  .use(runOnStart)
   *  .use(runBeforeStart, 'PREPARING')
   *
   * @example using a feature class will register and enable the feature
   *
   * export default class MyFeature extends Feature {
   *  featureId = 'registered-in-the-registry-with-this'
   *
   *  featureWasEnabled(config) {
   *    console.log('enabled with', config) // enabled with { option: 'passed to feature enable' }
   *  }
   * }
   *
   * // in another module
   * import MyFeature from 'myFeature'
   *
   * runtime.use(MyFeature, { option: 'passed to feature enable' })
   *
   * @example passing a string which refers to an already existing feature
   *
   * runtime.use('some-registered-feature')
   *
   * @memberof Runtime
   * @param {Function|Object|Feature|Helper} extension an object that meets the requirements to be an extension
   * @param {String|Object} [stage=INITIALIZING] which stage to run this middleware in (INITIALIZING, PREPARING, STARTING)
   * @returns {Runtime}
   */
  use(extension, stage) {
    const runtime = this

    if (isObject(extension) && isFunction(extension.initializer)) {
      return this.use(extension.initializer.bind(this), INITIALIZING)
    } else if (isFunction(extension) && extension.isSkypagerFeature) {
      const featureId =
        extension.featureId || extension.shortcut || extension.prototype.shortcut || extension.name

      if (!this.features.checkKey(featureId)) {
        this.features.register(featureId, () => extension)

        const myFeature = this.feature(
          featureId,
          isObject(stage) ? { ...this.options, ...stage } : this.options
        )

        myFeature.enable({
          ...this.options,
          ...(isObject(stage) ? stage : {}),
        })

        return this
      }
    } else if (isObject(extension) && isFunction(extension.attach)) {
      extension.attach.call(
        this,
        this,
        isObject(stage) ? { ...this.options, ...stage } : this.options,
        this.context
      )
    } else if (isObject(extension) && extension.default) {
      return this.use(extension.default, stage)
    }

    const m = extension.middleware || extension.use
    if (isObject(extension) && isFunction(m)) {
      extension = m
    }

    if (typeof extension === 'string') {
      if (runtime.availableFeatures.indexOf(extension) >= 0) {
        const featureId = extension
        extension = () => runtime.feature(featureId).enable()
        stage = stage || INITIALIZING
      } else {
        try {
          console.error(`Can not do dynamic requires anymore: You tried: ${extension}`)
        } catch (error) {}
      }
    }

    if (isFunction(extension) && stage === INITIALIZING) {
      extension.call(runtime, err => {
        if (err) {
          runtime.error(err.message || `Error while using extension ${extension.name}`, {
            error: err,
          })
          throw err
        }
      })

      return this
    }

    if (typeof extension !== 'function') {
      return this
    }

    if (typeof stage === 'undefined' && this.isPrepared) {
      stage = STARTING
    }

    const pipeline = runtime.result(['middlewares', stage || STARTING], () => {
      const p = mware(runtime)
      runtime.set(['middlewares', stage || STARTING], p)
      return p
    })

    pipeline.use(extension.bind(runtime))

    return this
  }

  get uuid() {
    return this._uuid
  }

  get cwd() {
    return this._cwd
  }

  get name() {
    return this._name
  }

  get logger() {
    return this._logger
  }

  get cache() {
    return this._cache
  }

  get selectors() {
    return this._selectors
  }

  get selectorCache() {
    return selectorCache.get(this)
  }

  /**
   * Yo dawg, I heard you like registries so here's a registry for your registries.
   *
   * @type {ContextRegistry}
   * @readonly
   * @memberof Runtime
   */
  get registries() {
    return this._registries
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

  /**
   * Set the value at an object path. Uses lodash.set
   *
   * @param {*} path
   * @param {*} value
   * @returns {?}
   * @memberof Runtime
   */
  set(path, value) {
    return lodash.set(this, path, value)
  }

  /**
   * Get the value at an object path.  Uses lodash.get
   *
   * @param {String} path
   * @param {*} defaultValue
   * @returns {?}
   * @memberof Runtime
   */
  get(path, defaultValue) {
    return get(this, path, defaultValue)
  }

  /**
   * Get the value at an object path. If that path is a function, we'll call it.
   * Uses lodash.result
   *
   * @param {*} path
   * @param {*} defaultValue
   * @returns {?}
   * @memberof Runtime
   */
  result(path, defaultValue, ...args) {
    return result(this, path, defaultValue, ...args)
  }
  /**
   * Check if runtime has a property
   *
   * @param {*} path
   * @param {*} defaultValue
   * @returns {Boolean}
   * @memberof Runtime
   */
  has(path) {
    return lodash.has(this, path)
  }

  /**
   * Invoke a function at a nested path
   *
   * @param {*} functionAtPath
   * @param {...*} args
   * @returns {?}
   * @memberof Runtime
   */
  invoke(functionAtPath, ...args) {
    return lodash.invoke(this, ...args)
  }

  pick(...args) {
    return lodash.pick(this, ...args)
  }

  /**
    The Context Types API defines a schema for properties that will be made available via the runtime's context system.

    You can specify your own context types when you are extending the Runtime class.  If you are using Skypager as
    a global singleton, you won't have the opportunity if you just require('skypager-runtime'), so you can define
    a global variable SkypagerContextTypes and it will use these instead.
  */
  static contextTypes = contextTypes

  /**
    The Options Types API defines a schema for properties that will be attached to the runtime as an options property.

    You can specify your own options types when you are extending the Runtime class.  If you are using Skypager as
    a global singleton, you won't have the opportunity if you just require('skypager-runtime'), so you can define
    a global variable SkypagerOptionTypes and it will use these instead.
  */
  static optionTypes = optionTypes

  /**
    The Default Context Object
  */
  static defaultContext = defaultContext

  static defaultOptions = defaultOptions

  static strictMode = enableStrictMode.toString() !== 'false'

  /**
   * Returns the contextTypes declarations for our Runtime class.
   *
   * @readonly
   * @memberof Runtime
   */
  get contextTypes() {
    return defaults({}, result('constructor.contextTypes'), {
      lodash: 'func',
      runtime: 'object',
      skypager: 'object',
      host: 'object',
      project: 'object',
    })
  }

  /**
   * the optionTypes declarations for our Runtime class
   *
   * @readonly
   * @memberof Runtime
   */

  get optionTypes() {
    return result(this.constructor, 'optionTypes', {})
  }

  /**
   * Returns the default context value for this runtime
   *
   * @readonly
   * @memberof Runtime
   */
  get defaultContext() {
    return result(this.constructor, 'defaultContext', {})
  }

  /**
   * Returns the default options for this runtime
   *
   * @readonly
   * @memberof Runtime
   */
  get defaultOptions() {
    return defaults(
      {},
      get(this, 'projectConfig'),
      result(this.constructor, 'defaultOptions'),
      // Find some way to be able to inject ARGV in projects which consume skypager via webpack
      global.SKYPAGER_ARGV,
      global.ARGV
    )
  }

  get optionsWithDefaults() {
    return defaults({}, this.rawOptions, this.defaultOptions)
  }

  get strictMode() {
    return !!get(this, 'rawOptions.strictMode', this.constructor.strictMode)
  }

  /**
   * @readonly
   * @memberof Runtime
   *
   * The options are what the runtime was initialized with.  Runtimes can be strict about which options they accept.
   */
  get options() {
    return this.strictMode
      ? pick(this.optionsWithDefaults, keys(this.optionTypes))
      : this.optionsWithDefaults
  }

  get context() {
    return defaults(
      {},
      pick(this.rawContext, keys(this.contextTypes)),
      this.defaultContext,
      { runtime: this, lodash: this.lodash },
      pick(global, keys(this.contextTypes))
    )
  }

  static spawn(options = {}, context = {}, fn) {
    return new Runtime(options, context, fn)
  }

  static attachEmitter(...args) {
    return attachEmitter(...args)
  }

  /**
   * Spawn a new Runtime instance
   *
   * @param {Object} [options={}]
   * @param {Object} [context={}]
   * @param {Function} [middlewareFn]
   * @returns {Runtime}
   * @memberof Runtime
   */
  spawn(options = {}, context = {}, middlewareFn) {
    if (isFunction(options)) {
      middlewareFn = options
      options = {}
      context = context || {}
    }

    if (isFunction(context)) {
      middlewareFn = context
      context = {}
    }

    return this.constructor.spawn(options, context, middlewareFn)
  }

  static get runtimes() {
    const base = this

    if (runtimesRegistry) {
      return runtimesRegistry
    }

    runtimesRegistry = new ContextRegistry('runtimes', {
      context: Helper.createMockContext(),
      wrapper(fn) {
        return (...args) => new fn(...args)
      },
      fallback(id) {
        return base || Runtime
      },
    })

    runtimesRegistry.register('universal', () => Runtime)

    return runtimesRegistry
  }

  static initializers = new ContextRegistry('initializers', {
    context: Helper.createMockContext(),
    useDefaultExport: true,
  })

  get initializers() {
    return this.constructor.initializers || Runtime.initializers
  }

  get runtimes() {
    return this.constructor.runtimes || Runtime.runtimes
  }

  /**
   * @type {EventEmitter}
   */
  static events = events

  registerRuntime(...args) {
    return this.constructor.registerRuntime(...args)
  }

  /**
   * If you have code that depends on a particular helper registry being available
   * on the runtime, you can pass a callback which will run when ever it exists and
   * is ready.  This is useful for example, when developing a feature which includes a
   * client and a server helper to go along with it.  If the runtime is web, you wouldn't
   * have a server helper so you wouldn't want to load that code.  If the same runtime is
   * used on a server, then you would run that code.
   *
   * @param {string} registryPropName - the name of the registry you want to wait for
   * @param {Function} callback - a function that will be called with runtime, the helperClass, and the options passed when attaching that helper
   * @memberof Runtime#
   *
   * @example @lang js <caption>Conditionally running code when the servers helper is attached</caption>
   *
   * runtime.onRegistration("servers", () => {
   *  runtime.servers.register('my-server', () => require('./my-server'))
   * })
   *
   */
  onRegistration(registryPropName, callback) {
    // to refactor the dynamic method attachment of various helpers,
    // i an prefixing their names with _ and then creating actual properties
    // on runtime so that I can jsdoc them
    registryPropName = registryPropName.replace(/^_/, '')

    if (typeof callback !== 'function') {
      throw new Error('Must pass a callback')
    }

    const alreadyRegistered = this.has(registryPropName)

    if (!alreadyRegistered) {
      Helper.events.on('attached', (runtime, helperClass, options = {}) => {
        const { registry = {} } = options || {}

        if (registry && registry.name === registryPropName) {
          callback(null, runtime, helperClass, options)
        }
      })
      return
    }

    const isValidHelper =
      this.helpers.checkKey(registryPropName) ||
      this.helpers.checkKey(stringUtils.singularize(registryPropName))

    if (!isValidHelper) {
      callback(new Error(`${registryPropName} does not appear to be a valid helper`))
    } else {
      callback(null, this, this.helpers.lookup(isValidHelper), {
        registry: this.get(registryPropName),
      })
    }
  }

  static registerRuntime(name, runtimeClass) {
    Runtime.runtimes.register(name, () => runtimeClass)
    return runtimeClass
  }

  /**
   * Register a Helper class as being available to our Runtime class
   *
   * @param {String} helperName - the name of the helper class
   * @param {Class} helperClass - a subclass of Helper
   *
   * @returns {Class} the helper class you registered
   */

  registerHelper(...args) {
    return this.constructor.registerHelper(...args)
  }

  /**
   * Register a Helper class as being available to this Runtime class
   *
   * @param {String} helperName - the name of the helper class
   * @param {Class} helperClass - a subclass of Helper
   *
   * @returns {Class} the helper class you registered
   */
  static registerHelper(name, helperClass) {
    registerHelper(name, () => helperClass)
    return helperClass
  }

  log(...args) {
    this.emit('loggingInfo', ...args)
    console.log(...args)
  }

  warn(...args) {
    this.emit('loggingWarning', ...args)
    console.warn ? console.warn(...args) : console.log(...args)
  }

  debug(...args) {
    this.emit('loggingDebug', ...args)
    console.debug ? console.debug(...args) : console.log(...args)
  }

  error(...args) {
    this.emit('loggingError', ...args)
    console.error ? console.error(...args) : console.log(...args)
  }

  info(...args) {
    this.emit('loggingInfo', ...args)
    console.info ? console.info(...args) : console.log(...args)
  }

  set name(val) {
    this.hide('_name', val, true)
  }

  get autoInitialize() {
    return (
      this.at('argv.autoInitialize', 'constructor.autoInitialize').find(
        v => typeof v !== 'undefined'
      ) !== false
    )
  }

  get autoPrepare() {
    return (
      this.at('argv.autoPrepare', 'constructor.autoPrepare').find(v => typeof v !== 'undefined') !==
      false
    )
  }

  get autoEnabledFeatures() {
    const { helperTags = [] } = this

    return (
      this.chain
        // whatever our constructor defines
        .get('constructor.autoEnable', {})
        .keys()
        .concat(
          this.chain
            .get('config.features', {})
            .pickBy(
              v =>
                v &&
                v.disabled !== true &&
                v.enabled !== false &&
                v.disable !== true &&
                v.enable !== false
            )
            .keys()
            .value()
        )
        // plus whatever features are already available whose name matches a helper tag prefix
        .concat(this.availableFeatures.filter(id => helperTags.find(tag => id.indexOf(tag) === 0)))
        // plus whatever features are requested in the options passed to our constructor
        .concat(castArray(this.get('argv.enable', [])))
        .flatten()
        .uniq()
        .reject(featureId => this.availableFeatures.indexOf(featureId) === -1)
        .value()
    )
  }

  static autoEnable = {
    vm: {},
  }

  static get features() {
    return Feature.registry
  }

  get runtimeInitializers() {
    const runtime = this
    const { initializers, helperTags: tags } = runtime
    const { pickBy } = this.lodash

    return pickBy(initializers.allMembers(), (fn, id) => !!tags.find(tag => id.indexOf(tag) === 0))
  }

  /**
   * A Runtime class will have certain initializer functions that it runs automatically
   * as part of the startup lifecycle, which initializers will be dependent on the target (e.g. node, web)
   * as well as the NODE_ENV environment (production, development, test)
   *
   * @private
   */
  applyRuntimeInitializers() {
    const { mapValues } = this.lodash
    const matches = this.runtimeInitializers

    Helper.attachAll(this, this.helperOptions)

    mapValues(matches, (fn, id) => {
      try {
        this.use(fn.bind(this), INITIALIZING)
      } catch (error) {
        this.error(`Error while applying initializer ${id}`, { error })
      }
    })

    Helper.attachAll(this, this.helperOptions)

    return this
  }

  /**
   * Attach all registered helpers to the runtime
   *
   * @private
   * @returns {Runtime}
   */
  attachAllHelpers() {
    Helper.attachAll(this, this.helperOptions)
    return this
  }

  /**
   * A Mixin is an object of functions.  These functions will get created as properties on this instance.
   *
   * @param {Mixin} mixin
   * @param {MixinOptions} options
   */
  mixin(mixin = {}, options = {}) {
    this.applyInterface(mixin, {
      transformKeys: true,
      scope: this,
      partial: [],
      right: true,
      insertOptions: false,
      hidden: false,
      ...options,
    })

    return this
  }

  /**
   * If you subclass Runtime, you can define your own initialize function which will be called during the constructor phase
   *
   * @abstract
   * @private
   * @memberof Runtime#
   * @returns {Runtime}
   */
  initialize() {
    return this
  }

  /**
   * If you subclass Runtime, you can define your own prepare function which will be called after the constructor phase
   *
   * @abstract
   * @private
   * @returns {PromiseLike<Runtime>}
   * @memberof Runtime#
   */
  async prepare() {
    return this
  }

  /**
   * If you subclass Runtime, you can define your own prepare function which will be called after the constructor phase
   *
   * @abstract
   * @private
   * @memberof Runtime#
   * @returns {PromiseLike<Runtime>}
   */
  async start() {
    return this
  }

  get url() {
    return this.isBrowser ? window.location : urlUtils.parse(`file://${this.cwd}`)
  }

  /**
    argv will refer to the initial options passed to the runtime, along with any default values that have been set
  */
  get argv() {
    return this.get('rawOptions', {})
  }

  set argv(val) {
    this.set('rawOptions', { ...this.rawOptions, ...val })
  }

  get env() {
    if (this.isTest) return 'test'
    if (this.isDevelopment) return 'development'
    if (this.isProduction) return 'production'

    return 'development'
  }

  /**
   * Based on the detected or specified platform the Runtime thinks it is in,
   * target will give us its name.  This can be used to auto-discover and register certain
   * helpers and features.
   *
   * @type {String}
   * @readonly
   * @memberof Runtime#
   */
  get target() {
    const { universal, target } = this.argv

    if (universal) return 'universal'
    if (target) return target
    if (this.isElectron) return 'electron'
    if (this.isNode) return 'node'
    if (this.isBrowser) return 'web'
    if (this.isReactNative) return 'native'

    return 'node'
  }

  /**
   * Returns a list of tags that can be used to filter all of the available helpers and features
   * to only those whose registry id or alias includes one of the tags.
   *
   * @type {Array<String>}
   * @readonly
   * @memberof Runtime#
   *
   * @example
   *
   *  runtime.helperTags // => ['development', 'development/node', 'node', 'node/development', 'universal']
   */
  get helperTags() {
    return this.get('options.helperTags', [
      this.env,
      `${this.env}/${this.target}`,
      this.target,
      `${this.target}/${this.env}`,
      'universal',
    ])
  }

  /**
   * Returns true if the runtime is running inside of a browser.
   *
   * @readonly
   * @memberof Runtime#
   */
  get isBrowser() {
    return windowIsAvailable && documentIsAvailable
  }

  /**
   * Returns true if the runtime is running inside of node.
   *
   * @readonly
   * @memberof Runtime#
   */
  get isNode() {
    try {
      const isNode = Object.prototype.toString.call(global.process) === '[object process]'
      return isNode
    } catch (e) {
      return processIsAvailable && (process.title === 'node' || `${process.title}`.endsWith('.exe'))
    }
  }

  /**
   * Returns true if running node in windows
   *
   * @readonly
   * @memberof Runtime#
   */
  get isWindows() {
    return this.isNode && `${process.title}`.endsWith('.exe')
  }

  /**
   * Returns true if the runtime is running inside of electron
   *
   * @readonly
   * @memberof Runtime#
   */
  get isElectron() {
    return (
      processIsAvailable &&
      !isUndefined(process.type) &&
      !isUndefined(process.title) &&
      (process.title.match(/electron/i) || process.versions['electron'])
    )
  }

  /**
   * Returns true if the runtime is running inside of electron's renderer process
   *
   * @readonly
   * @memberof Runtime#
   */
  get isElectronRenderer() {
    return (
      !isUndefined(process) &&
      process.type === 'renderer' &&
      windowIsAvailable &&
      documentIsAvailable
    )
  }

  /**
   * Returns true if the runtime is running inside of React-Native
   *
   * @readonly
   * @memberof Runtime#
   */
  get isReactNative() {
    try {
      return !isUndefined(global) && typeof navigator !== 'undefined' && navigator.product === 'ReactNative'
    } catch(error) {
      return false
    }
  }

  /**
   * Returns true if the process was started with a debug flag
   *
   * @readonly
   * @memberof Runtime#
   */
  get isDebug() {
    const { argv = {} } = this
    return !!argv.debug || argv.debugBrk || argv.inspect || argv.inspectBrk
  }

  /**
   * Returns true if the runtime is running in node process and common CI environment variables are detected
   *
   * @readonly
   * @memberof Runtime#
   */
  get isCI() {
    return this.isNode && (process.env.CI || (process.env.JOB_NAME && process.env.BRANCH_NAME))
  }

  /**
   * returns true when running in a process where NODE_ENV is set to development, or in a process started with the development flag
   *
   * @readonly
   * @memberof Runtime#
   */
  get isDevelopment() {
    const { argv = {} } = this
    return (
      !this.isProduction &&
      !this.isTest &&
      (argv.env === 'development' || process.env.NODE_ENV === 'development')
    )
  }

  /**
   * returns true when running in a process where NODE_ENV is set to test, or in a process started with the test flag
   *
   * @readonly
   * @memberof Runtime#
   */
  get isTest() {
    const { argv = {} } = this
    return argv.env === 'test' || process.env.NODE_ENV === 'test'
  }

  /**
   * returns true when running in a process where NODE_ENV is set to production, or in a process started with the test flag
   *
   * @readonly
   * @memberof Runtime#
   */
  get isProduction() {
    const { argv } = this
    return argv.env === 'production' || process.env.NODE_ENV === 'production'
  }

  /**
   * Any middleware functions which were added to runtime using the use function
   * get pushed onto a queue.  This function runs that queue
   * @private
   */
  runMiddleware(stage) {
    stage = stage || this.stage

    const runtime = this
    const pipeline = runtime.get(['middlewares', stage])

    if (!pipeline) {
      return Promise.resolve(this)
    }

    if (pipeline.getCount() === 0) {
      pipeline.use(next => {
        next()
      })
    }

    return new Promise((resolve, reject) => {
      pipeline.run(err => {
        err ? reject(err) : resolve(err)
      })
    })
  }

  static initialState = {}

  stateVersion = 0

  get initialState() {
    return defaults(
      { stage: 'CREATED' },
      this.get('argv.initialState'),
      global.__INITIAL_STATE__,
      result(global, 'SkypagerInitialState'),
      this.constructor.initialState
    )
  }

  getStateHash() {
    return this.hashObject(this.currentState)
  }

  getCurrentState() {
    const { convertToJS } = this
    const { mapValues } = this.lodash
    return this.state.toJSON()
  }

  getCacheKey() {
    return `${this.namespace}:${this.stateVersion}`
  }

  get stage() {
    return this.get('currentState.stage')
  }

  get isInitialized() {
    return this.get('currentState.initialized', false)
  }

  /**
   * Accepts a callback function which will be called when the runtime is started
   *
   * @param {Function} fn
   * @returns {Runtime}
   * @memberof Runtime
   */
  whenStarted(fn) {
    if (typeof fn !== 'function') {
      return this.whenStartedAsync()
    }

    if (this.isStarted) {
      fn.call(this, this, this.options, this.context)
    } else if (this.isFailed) {
      fn.call(this, this.currentStart.error, this.options, this.context)
    } else {
      this.once('runtimeDidStart', () => fn.call(this, this.options, this.context))
      this.once('runtimeFailedStart', error => fn.call(this, error, this.options, this.context))
    }

    return this
  }

  /**
   * Returns a promise that will resolve when the runtime is started.
   *
   * @returns {PromiseLike<Runtime>}
   * @memberof Runtime
   */
  whenStartedAsync() {
    return new Promise((resolve, reject) => {
      if (this.isStarted) {
        resolve(this)
        return
      } else if (this.sandbox.isFailed) {
        reject(this.currentState.error)
        return
      }

      this.once('runtimeDidStart', () => resolve(this))
      this.once('runtimeFailedToStart', error => reject(error))
    })
  }

  /**
   * @alias whenPrepared
   */
  whenReady(fn, onError) {
    return this.whenPrepared(fn, onError)
  }

  /**
   * @alias whenReadyAsync
   */
  whenReadyAsync() {
    return this.whenPreparedAsync()
  }

  /**
   * Takes a callback which will get called once this runtime is prepared
   *
   * @param {Function} fn
   * @param {Function} onError
   * @returns {PromiseLike<Runtime>}
   * @memberof Runtime
   */
  whenPrepared(fn, onError) {
    if (!isFunction(fn)) {
      return this.whenPreparedAsync()
    }

    try {
      if (this.isPrepared) {
        fn.call(this, this, this.options, this.context)
      } else {
        this.once('runtimeIsPrepared', () => fn.call(this, this.options, this.context))
      }
    } catch (error) {
      onError && onError(error)
    }

    return this
  }

  /**
   * Returns a promise which will resolve once the runtime is prepared
   *
   * @returns {PromiseLike<Runtime>}
   * @memberof Runtime
   */
  whenPreparedAsync() {
    return new Promise((resolve, reject) => {
      if (this.isPrepared) {
        resolve(this)
      } else {
        this.once('runtimeIsPrepared', () => resolve(this))
      }
    })
  }

  get isFailed() {
    return this.stage === START_FAILURE
  }

  get isPrepared() {
    return this.get('currentState.prepared', this.isRunning || this.isStarted)
  }

  get isRunning() {
    return this.get('currentState.started', false)
  }

  get isStarted() {
    return this.get('currentState.started', false)
  }

  /**
   * This will get called as part of the initialization sequence
   * @private
   */
  beginTrackingState() {
    if (this.mainDisposer) {
      return this
    }

    const mainDisposer = autorun((...args) => {
      this.stateVersion = this.stateVersion + 1
      const { currentState, stateVersion } = this
      this.emit('change', currentState, stateVersion, ...args)
      this.fireHook('stateDidChange', currentState, stateVersion, ...args)
      // emit an event on the global event bus
      this.events.emit('runtimeDidChange', this, currentState, stateVersion, ...args)
    })

    const stateDisposer = this.state.observe((update = {}) => {
      const { currentState, stateVersion } = this
      this.fireHook(`${update.name}DidChangeState`, update, currentState, stateVersion)
      this.emit('stateWasUpdated', update, currentState, stateVersion)
    })

    this.hide('mainDisposer', () => {
      mainDisposer()
      stateDisposer()
      return this
    })

    return this
  }

  /**
   * Replace the current state with the new state.  `newState` can be an object or a function which returns the new state
   *
   * @param {Object|Function} [newState={}] - a new object containing the state you wish the runtime to have
   * @param {Function} [cb] - a function we'll call when the state is replaced
   * @returns {Object} the current state after being replaced
   * @memberof Runtime
   * @fires Runtime#stateWillChange
   * @fires Runtime#stateWillReplace
   */
  replaceState(newState = {}, cb) {
    const { isFunction, toPairs } = this.lodash

    /**
     * @event Runtime#stateWillChange
     */
    this.emit('stateWillChange', this.currentState, newState)

    /**
     * @event Runtime#stateWillReplace
     */

    this.emit('stateWillReplace', this.currentState, newState)

    if (isFunction(newState)) {
      newState = newState(this.currentState, this)
    }

    const result = this.state.replace(toPairs(newState))

    if (isFunction(cb)) {
      cb(this.currentState)
    }

    return result
  }

  /**
   * Replace the current state with the new state
   *
   * @param {Object|Function} [newState={}] - a new object containing the state you wish the runtime to have
   * @param {Function} [cb] - a function we'll call when the state is replaced
   * @returns {Object} the current state after being replaced
   * @memberof Runtime
   * @fires Runtime#stateWillChange
   */
  setState(newState = {}, cb) {
    const { isFunction, toPairs } = this.lodash

    if (isFunction(newState)) {
      newState = newState(this.currentState, this)
    }

    /**
     * @event Runtime#stateWillChange
     */
    this.emit('stateWillChange', this.currentState, newState)

    const result = this.state.merge(toPairs(newState))

    if (isFunction(cb)) {
      cb(this.currentState)
    }

    return result
  }

  /**
   * @abstract
   */
  stateDidChange() {}

  observe(listener, prop = 'state') {
    return observe(prop ? this.get(prop) : this, change => listener.call(this, change))
  }

  makeObservable(properties = {}, target) {
    target = target || this

    properties = omitBy(properties, (val, key) => lodash.has(target, key))

    // WOW clean this up
    // prettier-ignore
    return extendObservable(target, mapValues(properties, val => {
        if (!isArray(val)) {
          return val
        }

        const [observableType, initialValue] = val
        const f = observable[observableType]

        if (observableType !== 'action' && observableType !== 'computed' && !f) {
          throw new Error(`Invalid Observable: ${observableType}`)
        }

        if (observableType === "map" && isObject(initialValue)) {
          return f(toPairs(initialValue))
        } else if (observableType === "shallowMap" && isObject(initialValue)) {
          return f(toPairs(initialValue))
        } else if (observableType === "object") {
          return f(val[1] || {})
        } else if (observableType === "shallowObject") {
          return f(val[1] || {})
        } else if (observableType === "shallowArray") {
          return f(val[1] || [])
        } else if (observableType === "array") {
          return f(val[1] || [])
        } else if (observableType === "struct") {
          return f(val[1] || [])
        } else if (observableType === "computed" && isFunction(initialValue)) {
          return computed(val[1].bind(target))
        } else if (observableType === "action" && isFunction(initialValue)) {
          return action(val[1].bind(target))
        } else {
          return val
        }
      })
    )
  }

  createObservable(properties = {}, observerFn, scope) {
    const instance = observable(properties)

    if (observerFn) {
      const disposer = observe(instance, change =>
        observerFn.call(scope || instance, change, instance, this.context)
      )

      hide(instance, 'cancelObserver', () => {
        disposer()
        return instance
      })
    }

    hide(instance, 'toJS', () => toJS(instance))

    return instance
  }

  observeState(handler) {
    return this.state.observe(handler)
  }

  interceptState(handler) {
    return this.state.intercept(handler)
  }

  convertToJS(...args) {
    return toJS(...args)
  }

  /**
   * This function is a hook that gets called by the helper.createInstance lifecycle
   *
   * I believe i originally had this setup as a hook on runtime so that, either:
   *
   *  1) runtime could be in control of what observability means, and the helpers just expect an interface to it
   *  2) as a form of code splitting? since runtime has the mobx dependency bundled with it, and we want to be able to export a small helper class?
   *
   * This hook decorates the instance of the helper with mobx observable properties, which includes
   * observable objects, actions, and computed attribute getters
   */
  didCreateObservableHelper(helperInstance, helperClass) {
    if (helperInstance.tryGet('observables')) {
      const observables = helperInstance.tryResult('observables', {})
      this.makeObservable(observables, helperInstance)
    }

    if (!helperInstance.has('state')) {
      makeStateful(helperInstance)
    }

    // can't think of any classes which define it as a static property
    if (helperClass.observables) {
      const observables = isFunction(helperClass.observables)
        ? helperClass.observables.call(
            helperInstance,
            helperInstance.options,
            helperInstance.context,
            helperInstance
          )
        : helperClass.observables

      this.makeObservable(observables, helperInstance)
    }

    Promise.resolve(helperInstance.setInitialState())
  }

  static ContextRegistry = ContextRegistry
  static Helper = Helper

  static mobx = mobx
  get mobx() {
    return this.constructor.mobx
  }

  static observableMap = observable.map
  get observableMap() {
    return observable.map
  }

  static lodash = lodash
  get lodash() {
    return lodash
  }

  static pathUtils = pathUtils

  get pathUtils() {
    return pathUtils
  }

  static stringUtils = stringUtils

  get stringUtils() {
    return stringUtils
  }

  static propUtils = propUtils

  get propUtils() {
    return propUtils
  }

  static urlUtils = urlUtils
  get urlUtils() {
    return urlUtils
  }

  get Runtime() {
    return Runtime
  }

  get BaseRuntime() {
    return Runtime
  }

  get helperEvents() {
    return Helper.events
  }

  get runtimeEvents() {
    return events
  }

  /**
   * Provides access to the global event bus shared by all runtime or helper instances
   *
   * @readonly
   * @memberof Runtime
   */
  get events() {
    return events
  }

  /**
   * Creates a context variable that can be pass down to helpers, or used with the VM
   * to run scripts or modules in an arbitrary global scope
   *
   * @readonly
   * @memberof Runtime
   */
  get sandbox() {
    return this.createSandbox(this.context)
  }

  /**
   * Gets the ids of all of the features that are available in the runtime's feature registry,
   * as well as any features that are part of the runtime's class level feature registry.
   * @type {Array<String>}
   * @readonly
   * @memberof Runtime#
   */
  get availableFeatures() {
    const mine = this.get('features.available', [])
    const constructors = this.get('constructor.features.available', [])
    return uniq([...mine, ...constructors])
  }

  /**
   * Returns an object the features that are enabled.  The keys are going to be
   * the registry id of that feature, and the values will be the feature helper instance
   *
   * @type {Object<String, Feature>}
   * @readonly
   * @memberof Runtime#
   */
  get enabledFeatures() {
    return this.chain
      .invoke('featureStatus.toJSON')
      .pickBy(v => v.status === 'enabled')
      .mapValues(v => this.cache.get(v.cacheKey))
      .omitBy(v => !v)
      .value()
  }

  /**
   * Returns the ids of the features that are enabled.
   *
   * @type {Array<String>}
   * @readonly
   * @memberof Runtime#
   */
  get enabledFeatureIds() {
    const { keys } = this.lodash
    return keys(this.enabledFeatures)
  }

  /**
   * Returns an object of the enabled features, the keys will be the shortcut property
   * that is defined on the feature.  If the feature does not define one, then it won't
   * show up here.
   *
   * @readonly
   * @memberof Runtime#
   */
  get featureRefs() {
    const { mapKeys, omitBy, isEmpty } = this.lodash
    const { enabledFeatures } = this

    const withShortcuts = mapKeys(enabledFeatures, feature =>
      feature.tryGet('shortcut', feature.tryGet('createGetter'))
    )

    return omitBy(withShortcuts, (v, k) => isEmpty(k))
  }

  /**
   * Tells you if a feature is enabled or not.
   *
   * @param {String} name
   * @returns {Boolean}
   * @memberof Runtime#
   */
  isFeatureEnabled(name) {
    const item = this.featureStatus.get(name)

    if (!item) {
      return false
    }

    if (item && item.status === 'enabled') {
      return true
    }

    return false
  }

  /**
   * Enable multiple features at a time
   *
   * @param {*} [options={}]
   * @returns
   * @memberof Runtime
   */
  enableFeatures(options = {}) {
    const { availableFeatures } = this

    if (typeof options === 'string' || typeof options === 'undefined') {
      options = [options].filter(v => v)
    }

    if (isArray(options)) {
      options = options.reduce((memo, val) => {
        if (typeof val === 'string') {
          memo[val] = {}
        } else if (isArray(val)) {
          memo[val[0]] = val[1]
        } else {
        }

        return memo
      }, {})
    }

    return mapValues(pick(options, availableFeatures), (cfg, id) => {
      let feature
      try {
        if (this.features.checkKey(id)) {
          feature = this.feature(id)
        } else if (this.constructor.features.available.indexOf(id) >= 0) {
          feature = this.feature(id, {
            provider: this.constructor.features.lookup(id),
          })
        }

        feature.enable(cfg)
        this.fireHook('featureWasEnabled', feature, this)
        Helper.attachAll(this, this.helperOptions)

        return feature
      } catch (error) {
        this.fireHook('featureFailedToEnable', feature, error)
        return error
      }
    })
  }

  /**
   * Runs a life cycle hook method on the runtime. A hook method can either be
   * a standard instance method on runtime, and if one does not exist, an event is
   * also emitted by the same name
   *
   * @param {String} hookName the name of the hook method
   * @param {...*} args any args you want to pass to the hook
   * @returns {Runtime}
   * @memberof Runtime#
   * @emits Runtime#firingHook
   */
  fireHook(hookName, ...args) {
    if (this.argv.debugHooks) {
      this.debug(`Firing Hook`, { hookName, argsLength: args.length })
    }

    const fnHandler = this.get(['options', hookName], this.get(hookName))

    this.runtimeEvents.emit(`runtime:${hookName}`, this, ...args)
    this.emit(`firingHook`, hookName, ...args)
    this.emit(hookName, ...args)

    if (fnHandler) {
      try {
        fnHandler.call(this, ...args)
      } catch (error) {
        this.argv.debugHooks &&
          this.error(`Error while firing hook: ${hookName}`, { error: error.message })
        this.emit('hookError', hookName, error)
      }
    } else {
      if (this.argv.debugHooks) {
        this.debug(`No hook named ${hookName} present`)
      }
    }

    return this
  }

  /**
   * Returns the base Feature class that the runtime uses.  You shouldn't need to change this,
   * however you can use one class in production and another in dev / test if you want to,
   *
   * @readonly
   * @type {Class}
   * @memberof Runtime#
   */
  Helper = Helper

  /**
   * Provides access to the Helper registry
   *
   * @readonly
   * @memberof Runtime
   */
  get helpers() {
    return this.Helper.registry
  }

  /**
   * Provides access to all of the Helper classes that have been registered
   *
   * @readonly
   * @memberof Runtime
   */
  get allHelpers() {
    return this.Helper.allHelpers
  }

  /**
   * The default options that will be passed to Helper.attach.
   *
   * @type {import("./helper").HelperAttachOptions}
   * @readonly
   * @memberof Runtime#
   */
  get helperOptions() {
    return this.get('options.helperOptions', this.get('context.helperOptions', {}))
  }

  /**
   * Returns the base Feature class that the runtime uses.  You shouldn't need to change this,
   * however you can use one class in production and another in dev / test if you want to,
   *
   * @type {Class}
   * @memberof Runtime#
   */
  Feature = Feature

  /**
   * Create an instance of a Feature from one of the available Feature providers in the registry.
   *
   * Calling this method more than once with the same options, will return the same object, unless that
   * Helper class or the registry it is a part sets isCacheable = false
   *
   * @param {String} featureModuleId
   * @param {Object} [options={}]
   * @param {Object} [context={}]
   * @returns {Feature}
   * @memberof Runtime
   */
  feature(featureModuleId, options = {}, context = {}) {
    return this._feature(featureModuleId, options, context)
  }

  /**
   * Provides access to the Feature helper's registry
   *
   * @readonly
   * @memberof Runtime#
   */
  get features() {
    return this._features || Feature.registry
  }

  get namespace() {
    return this.get('options.namespace', 'runtime')
  }

  createRegistry(name, options = {}) {
    const registry = Helper.createRegistry(name, {
      context: Helper.createMockContext({}),
      ...options,
    })

    this.fireHook('registryWasCreated', name, registry, options)

    return registry
  }

  createSandbox(ctx = {}) {
    return {
      // all aliases i've used over time for the same thing. should deprecrate them gracefully
      project: this,
      runtime: this,
      skypager: this,
      host: this,
      propUtils,
      stringUtils,
      urlUtils,
      mobx,
      lodash,
      currentState: this.currentState,
      ...this.featureRefs,
      ...ctx,
    }
  }

  /**
   * Returns an md5 hash for any JavaScript object
   *
   * @param {Object} anyObject - any object you want to calculate a unique hash for
   */
  hashObject(anyObject) {
    return hashObject(anyObject)
  }

  /**
   * Creates an entity object from any slice of runtime properties / values
   */
  createEntityFrom(...properties) {
    const src = this.slice(...properties)
    return entity(toJS(src))
  }

  /**
   * Select a slice of state using a list of object paths, can be multiple levels deep a.b.c
   *
   * @param {*} properties - an array of strings representing object paths
   * @returns {*}
   * @memberof Runtime
   */
  slice(...properties) {
    return toJS(zipObjectDeep(properties, this.at(properties)))
  }

  /**
   * Fetch a object from runtime.options or runtime.context
   *
   * If the method is a function, it will be called in the scope of the helper,
   * with the helpers options and context
   *
   * @param {String} objectPath the dot.path to the property
   * @param {*} defaultValue the default value
   * @memberof Runtime
   */
  tryGet(property, defaultValue) {
    return (
      this.at(`options.${property}`, `context.${property}`).filter(
        v => typeof v !== 'undefined'
      )[0] || defaultValue
    )
  }
  /**
   * Fetch a object from runtime.options or runtime.context
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

  // Merge the objects found at k starting with at options, provider, projectConfig
  mergeGet(key, namespaces = ['options', 'argv', 'config']) {
    key = typeof key === 'string' ? key.split('.') : key
    key = flatten(castArray(key))

    return defaults({}, ...namespaces.map(n => this.get([n, ...key])))
  }

  // Merge the objects found at k starting with at options, provider, projectConfig
  // If the property is a function, it will be called in the scope of the helper, with the helpers options and context
  mergeResult(key, namespaces = ['options', 'argv', 'config']) {
    key = typeof key === 'string' ? key.split('.') : key
    key = flatten(castArray(key))

    const ifFunc = v => (typeof v === 'function' ? v.call(this, this.options, this.context) : v)

    return defaults({}, ...namespaces.map(n => this.get([n, ...key])).map(ifFunc))
  }

  /**
   * Runs a selector function by first checking against the selectorCache
   *
   * @param {*} selectorId
   * @param {*} args
   * @returns {PromiseLike<*>}
   * @memberof Runtime
   */
  async selectCached(selectorId, ...args) {
    if (this.selectorCache.get(selectorId)) {
      return this.selectorCache.get(selectorId)
    }

    return this.select(selectorId, ...args)
  }

  /**
   * Runs an async selector function from the registry.
   *
   * A selector function will be passed an instance of `lodash.chain({Runtime})` and should return that chain.
   *
   * @param {String} selectorId a selector function that exists in the selectors registry
   * @param {*} args
   * @returns {PromiseLike<*>}
   * @memberof Runtime
   * @example @lang js
   *
   * runtime.selectors.register('something', () => async (chain, eachItem) => {
   *  const results = await doStuff()
   *  return chain
   *    .plant(results)
   *    .groupBy('column')
   *    .mapValues((groupName, items) => items.map(eachItem))
   * })
   *
   * const value = await runtime.select('something', (item) => item + 1)
   */
  async select(selectorId, ...args) {
    let selector = this.selectors.lookup(selectorId)

    selector = isFunction(selector.default) ? selector.default : selector

    const result = await selector.call(this, this.chain, ...args)

    return isFunction(result.value) ? result.value() : result
  }

  /**
   * Same as `select` but accepts passing a function as the last argument.
   * This function will be called with the result of the selector function
   *
   * @param {String} selectorId a selector function that exists in the selectors registry
   * @param {*} args args to pass thru to the function. the last argument should be a function.
   * @memberof Runtime
   * @returns {PromiseLike<*>}
   */
  async selectThru(selectorId, ...args) {
    const fn =
      args.length && typeof args[args.length - 1] === 'function'
        ? args[args.length - 1]
        : this.lodash.identity

    const response = await this.selectChain(selectorId, ...args)

    return response.thru(fn).value()
  }

  /**
   * Same as `selectThru` but returns the resulting lodash chain still in chain mode
   *
   * @param {string} selectorId the id of the registered selector function
   * @param {...*} args args to pass thru to the selector.  if the last arg is a function
   *                    it will receive the value as a lodash chain.thru()
   * @returns {LodashChain}
   */
  async selectChainThru(selectorId, ...args) {
    const fn =
      args.length && typeof args[args.length - 1] === 'function'
        ? args[args.length - 1]
        : this.lodash.identity

    const response = await this.selectChain(selectorId, ...args)

    return response.thru(fn)
  }

  /**
   * Same as `select` but returns the resulting lodash chain still in chain mode.
   *
   * @param {String} selectorId a selector function that exists in the selectors registry
   * @param {*} args arguments to be passed thru to the selector function
   * @returns {PromiseLike<*>}
   */
  async selectChain(selectorId, ...args) {
    const results = await this.select(selectorId, ...args)
    return lodash.chain(results)
  }

  /**
   * @returns {Runtime} the runtime singleton
   */
  static get framework() {
    return (frameworkRuntime = frameworkRuntime || this.createSingleton())
  }

  /**
   * @returns {Runtime} the runtime singleton
   */
  static createSingleton(options, context, middlewareFn) {
    return (singleton = singleton || new this(options, context, middlewareFn))
  }

  /**
   * Access the Helper class, which you can extend to create your own Helpers
   *
   * @static
   * @memberof Runtime
   */
  static Helper = Helper

  /**
   * Access the Feature class, one of the core Helpers available in the Skypager Runtime
   *
   * @static
   * @memberof Runtime
   */
  static Feature = Feature

  static autoConfigs = []

  static autoAdd = []
}

export const createSingleton = Runtime.createSingleton.bind(Runtime)

export const INITIALIZING = 'INITIALIZING'
export const INITIALIZED = 'INITIALIZED'
export const PREPARING = 'PREPARING'
export const READY = 'READY'
export const STARTING = 'STARTING'
export const RUNNING = 'RUNNING'
export const START_FAILURE = 'START_FAILURE'
export const PREPARE_FAILURE = 'PREPARE_FAILURE'
export const INITIALIZE_FAILURE = 'INITIALIZE_FAILURE'

export const stages = {
  INITIALIZING,
  INITIALIZED,
  PREPARING,
  READY,
  STARTING,
  RUNNING,
  START_FAILURE,
  INITIALIZE_FAILURE,
  PREPARE_FAILURE,
}

export function initializeSequence(runtime, initializeMethod) {
  if (runtime.isInitialized) return runtime

  runtime.fireHook('beforeInitialize', runtime)

  runtime.beginTrackingState()
  runtime.setState({ stage: INITIALIZING, initialized: true })

  try {
    initializeMethod.call(runtime)
  } catch (error) {
    runtime.setState({ stage: INITIALIZE_FAILURE, error })
    throw error
  }

  runtime.fireHook('afterInitialize', runtime)
  runtime.setState({ stage: INITIALIZED })
  events.emit('runtimeDidInitialize', runtime, runtime.constructor)

  runtime.attachAllHelpers()

  if (runtime.autoPrepare !== false) Promise.resolve(runtime.prepare())

  return runtime
}

export async function prepareSequence(runtime, prepareMethod) {
  if (runtime.isPrepared) return runtime

  runtime.setState({ stage: PREPARING })
  runtime.fireHook('preparing')

  try {
    await this.runMiddleware(PREPARING)
  } catch (error) {
    runtime.setState({ stage: PREPARE_FAILURE, error })
    runtime.fireHook('prepareDidFail', error)
    throw error
  }

  try {
    if (typeof runtime.options.prepare === 'function') {
      await Promise.resolve(runtime.options.prepare.call(runtime, runtime.argv, runtime.sandbox))
    }

    await prepareMethod.call(runtime, runtime.argv, runtime.sandbox)

    runtime.setState({ stage: READY, prepared: true })
  } catch (error) {
    runtime.setState({ stage: PREPARE_FAILURE, error })
    runtime.fireHook('prepareDidFail', error)
    throw error
  }

  runtime.fireHook('runtimeIsPrepared')
  return runtime
}

export async function startSequence(runtime, startMethod) {
  if (runtime.stage === RUNNING) return runtime
  if (runtime.isStarted) return runtime

  const beforeHooks = runtime
    .at('options.beforeStart', 'beforeStart', 'options.runtimeWillStart', 'runtimeWillStart')
    .filter(f => typeof f === 'function')

  events.emit('runtimeIsStarting', runtime, runtime.constructor)

  if (beforeHooks.length > 0) {
    try {
      await Promise.all(beforeHooks.map(fn => fn.call(runtime, runtime.argv, runtime.sandbox)))
    } catch (error) {
      events.emit('runtimeStartFailure', error, runtime, runtime.constructor)
      runtime.setState({ stage: START_FAILURE, error, failureStage: 'beforeHooks' })
      throw error
    }
  }

  try {
    runtime.setState({ stage: STARTING })
    await this.runMiddleware(STARTING)
  } catch (error) {
    events.emit('runtimeFailedStart', error, runtime, runtime.constructor)
    runtime.fireHook('runtimeFailedStart', error, runtime, runtime.constructor)
    runtime.setState({ stage: START_FAILURE, error, failureStage: 'middlewares' })
    throw error
  }

  try {
    await startMethod.call(runtime, runtime.options)
  } catch (error) {
    events.emit('runtimeFailedStart', error, runtime, runtime.constructor)
    runtime.setState({ stage: START_FAILURE, error, failureStage: 'startMethod' })
    runtime.fireHook('runtimeFailedStart', error, runtime, runtime.currentState)
    throw error
  }

  runtime.setState({ stage: RUNNING, started: true })
  runtime.fireHook('runtimeDidStart', runtime, runtime.currentState)
  events.emit('runtimeDidStart', runtime, runtime.currentState, runtime.constructor)

  return this
}

export function makeStateful(obj = {}) {
  obj.stateVersion = 0

  extendObservable(obj, {
    state: observable.shallowMap(toPairs(obj.initialState || {})),
    currentState: computed(() => obj.state.toJSON()),
  })

  autorun((...args) => {
    const stateVersion = (obj.stateVersion = obj.stateVersion + 1)
    const { currentState } = obj
    obj.emit && obj.emit('change', obj, currentState, stateVersion)
    obj.fireHook && obj.fireHook('stateDidChange', currentState, stateVersion)
  })

  obj.state.observe((update = {}) => {
    obj.fireHook && obj.fireHook(`${update.name}DidChangeState`, update)

    if (obj.emit) {
      obj.emit('stateDidChange', update)
      obj.emit(`${update.name}DidChangeState`, update)
    }
  })

  // obj.getter('currentState', () => obj.state.toJSON())

  return obj
}

export default Runtime
