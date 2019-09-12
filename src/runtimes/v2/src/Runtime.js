import Entity from './Entity'
import Helper from './Helper'
import Registry from './Registry'
import Feature, { attach as attachFeature } from './Feature'
import State from './State'
import Logger from './Logger'
import { hideGetter } from './utils/prop-utils'
import lodash from './lodash'


/**
 * The Runtime is intended to act as a global service (like window or document) for cross platform
 * JavaScript applications 
 */
export class Runtime extends Entity {
  vm  

  /** 
   * @param {Object} options
   * @param {LoggingOptions} [options.logging] options for the logger 
  */
  constructor(options = {}, context = {}) {
    super({
      ...lodash.omit(options, 'logging'),
      initialState: global.__INITIAL_STATE__ 
    })

    this._context = context
    hideGetter(this, '_context', () => context)

    /*
    const selectors = new Registry()
    this.selectors = selectors
    hideGetter(this, 'selectors', () => selectors)
    */

    const _settings = new State()
    this._settings = _settings
    hideGetter(this, '_settings', () => _settings)

    const featureStatus = new State()
    this.featureStatus = featureStatus
    hideGetter(this, 'featureStatus', () => featureStatus)

    trackFeatureState(this)

    const features = Feature.createRegistry({ host: this })
    this._features = features
    hideGetter(this, '_features', () => features)

    const feature = Feature.createFactory({
      registry: features,
      host: this,
    })
    this._feature = feature
    hideGetter(this, '_feature', () => feature)

    setTimeout(() => this.startObservingState(), 0)

    const extensions = []
    this.extensions = extensions 
    hideGetter(this, 'extensions', () => extensions)

    const loggingOptions = {
      console,
      ...options.logging,
    }

    const logger = new Logger({
      prefix: `runtime`,
      level: 'info',
      ...loggingOptions
    })

    this.logger = logger
    hideGetter(this, 'logger', () => logger)
  }

  disableLogging() {
    this.logger.disable()
    return this
  }

  enableLogging(level, options = {}) {
    this.logger.enable(level)

    if (options.retain) {
      const store = (level, args) => {
        this.logger.messages.push({ level, args, timestamp: +new Date() })
      }

      this.logger.off(':level', store)

      this.disableLogRetention = () => {
        this.logger.off(':level', store)  
        delete this.disableLogRetention
      }
    }

    return this
  }
  
  log(...args) { return this.logger.log(...args) }
  debug(...args) { return this.logger.debug(...args) }
  info(...args) { return this.logger.info(...args) }
  warn(...args) { return this.logger.warn(...args) }
  error(...args) { return this.logger.error(...args) }

  /**
   * @type {Registry}
   */
  get features() {
    return this._features
  }

  /**
   * @returns {Feature}
   */
  feature(featureId, options = {}) {
    return this._feature(featureId, options)
  }

  get enabledFeatureIds() {
    return this.featureStatus.values().filter(({ status }) => status === 'enabled').map(f => f.name)
  }

  isFeatureEnabled(featureName) {
    return this.featureStatus.get(featureName) && this.featureStatus.get(featureName).status === 'enabled'
  }

  /**
   * Pass a settings object, or a function which returns one.
   * This object will be merged into a global settings map which
   * can be used to pass runtime | global | environment | process | file based configuration (e.g. package.json)
   * down to any instance of any helper.
   *
   * @param {Object|Function} config
   * @returns {Runtime}
   */
  configure(config) {
    const { isFunction, isObject } = this.lodash

    if (isFunction(config)) {
      return this.configure(config.call(this, this.options, this.context))
    } else if (isObject(config)) {
      this._settings.merge(config)
    }

    return this
  }

  /**
   * @type {Object<String,*>}
   */
  get settings() {
    return this._settings.toJSON()
  }

  /**
   * @type {Runtime}
   */
  get runtime() {
    return this
  }

  /**
   * @type {Object<String,*>}
   */
  get context() {
    const runtime = this

    return {
      ...this._context,
      get runtime() {
        return runtime
      },
    }
  }

  get lodash() {
    return lodash
  }

  get Helper() {
    return Helper
  }

  get Feature() {
    return Feature
  }

  get Registry() {
    return Registry
  }

  get Entity() {
    return Entity
  }

  /**
   * Starting the runtime will activate any extensions which have an asynchronous
   * component, and finish when all of these extensions have finished
   *
   * @returns {Promise<Runtime>}
   */
  async start() {
    try {
      await runMiddlewares(this)
    } catch(error) {

    }
  }

  /**
   * The extension API for the Runtime enables us to define different layers of
   * dependencies and how they are loaded and activated, so that when the runtime is
   * created, and when the runtime is started, you can guarantee that certain functionality
   * and application state is available.
   *
   * This gives us full control over the boot cycle of applications built against a shared
   * runtime.
   *
   * @param {ExtensionModule|String|Function} extension
   * @param {Object} [options={}]
   */
  use(extension, options = {}) {
    const { isFunction, isObject } = this.lodash

    if (extension.isHelper && isFunction(extension.attach)) {
      extension.attach(this, options)
      return this
    } else if (isObject(extension) && isFunction(extension.attach)) {
      extension.attach(this, options)
      return this
    } else if (isFunction(extension)) {
      this.extensions.push([extension.bind(this), options])
    } else if (typeof extension === 'string' && this.features.has(extension)) {
      Promise.resolve(this.feature(extension, options).enable())
    }

    return this
  }

  /** 
   * @param {HelperClass} HelperClass the helper class you wish to create an instance of
   * @returns {Object}
  */
  createHelper(HelperClass, options = {}, context = {}) {
    return HelperClass.create(options, {
      runtime: this,
      ...this.context,
      ...context,
    })
  }
}

export default Runtime

/** 
 * @typedef {Helper} HelperClass
 * @property {Function} attach
 * @property {Function} create
 * @property {Boolean} [isHelper=true]
*/

/**
 * The runtime instance can be extended with plugins.  A plugin is either a function which gets passed a done 
 * callback that it should call when finished, or an object which has an attach function that runs synchronously.
 * 
 * Loading an extension is done through runtime.use(ExtensionModule1).use(ExtensionModule2)
 * 
 * @typedef {Object|Function} ExtensionModule
 * @property {Function} [attach]
 * @property {Boolean} [isHelper]
 */

async function runMiddlewares(runtime) {
  const extensions = runtime.extensions || []

  for(let middleware of extensions.filter(fn => !fn.ran)) {
    const next = (err) => {
      if (err) {
        throw err
      }      
    }  

    const [fn, options] = middleware

    try {
      await fn.call(runtime, next, options)
    } catch(error) {
      console.log('error in middleware', error.message)
      throw error
    }
  }
}

function trackFeatureState(runtime) {
  runtime.on('featureWasEnabled', (feature) => {
    runtime.debug(`${feature.toString()} was enabled.`)

    runtime.featureStatus.patch(feature.name, {
      status: 'enabled',
      name: feature.name
    })
  })
}

/** 
 * @typedef {Object} LoggingOptions
 * @property {Number} [retain=0] number of messages to retain if any
 * @property {String|Number} [level=info] one of info,debug,warn,error
 * @property {Object<String,Function>} [console=console]
*/
