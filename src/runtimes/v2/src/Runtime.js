import Entity from './Entity'
import Helper from './Helper'
import Registry from './Registry'
import Feature, { attach as attachFeature } from './Feature'
import State from './State'
import { hideGetter } from './utils/prop-utils'
import lodash from './lodash'


/**
 * The Runtime is a container for any JavaScript application in any environment.  All JavaScript programs exist 
 * assuming the existence of a few global objects. 
 * 
 * - document / window in the browser 
 * - module / require / process ) in node
 * 
 * Each object is a potentially infinite tree of objects, with properties that point to other objects,
 * or functions, lazy loadable properties, async loading, etc.
 *
 * The Runtime class allows you to define a global service like object (e.g. window, document, global) that is
 * a platform agnostic container for "your" code, capable of "dependency injection", and capable of acting as an
 * inversion of control service.  
 * 
 * When you write an application, whether in the browser, or node, the `runtime` singleton is something you can talk to 
 * to manage the state and lifecycle of an application, to learn about the environment and which features are available 
 * on the runtime, as well as a module loader for you to interact with so that you can easily build your applications as 
 * small independent modules or groups of modules for a team to divide responsibility.  
 *
 * You should design your JavaScript application around the fact that 80% of the functionality is derived
 * from open source third party dependencies, which you change less frequently, and can easily load from
 * a cache such as a CDN.  You don't want a small change in one of your React components to require you to download
 * the whole React, React DOM, and other libraries.  
 * 
 * You should also design them around lazy loading, so you only load the code you need to serve the current 
 * experience, and lazy load the rest at whatever point it is needed by the application.  There's no sense downloading
 * code for premium users, when a free trial user is logged into your application.
 *
 * The runtime provides you with a system to do all of this in a clean and logical way.
 */
export class Runtime extends Entity {
  vm  

  constructor(options = {}, context = {}) {
    super(options)

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
  }

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

  get chain() {
    return lodash.chain(this)
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
    return this
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
   * @param {*} extension
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
    }
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
 * @property {Function} attach
 * @property {Boolean} isHelper
 */

