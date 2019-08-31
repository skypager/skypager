import lodash from 'lodash'
import Entity from './Entity'
import Helper from './Helper'
import Registry from './Registry'
import Feature, { attach as attachFeature } from './Feature'
import State from './State'
import { hideGetter } from './utils/prop-utils'

/**
 * @typedef {Object} ExtensionModule
 * @property {Function} attach
 * @property {Boolean} isHelper
 */

/**
 * The Runtime is a container for any JavaScript application in any environment.  All of JavaScript exists from a few
 * global objects. Each object is a potentially infinite tree of objects, with properties that point to other objects,
 * functions, lazy loaded objects, async loading.
 *
 * The Runtime class allows you to define a global service like object (e.g. window, document, global) that can act as
 * a framework for loading and starting any combination of modules your application architecture defines.
 *
 * You should design your JavaScript application around the fact that 80% of the functionality is derived
 * from open source third party dependencies, which you change less frequently, and can easily load from
 * a cache such as a CDN.  You should also design them around lazy loading, so you only load the code you
 * need to serve the current experience, and lazy load the rest at whatever point it is needed by the application.
 *
 * JavaScript Applications can be designed to be containerized, the way Dockerfile containerizes
 * a server application runtime using cacheable layers which can be loaded in order.  Docker can inject
 * environment variables, mount dynamic data at runtime through volume mounts, all from a cached collection
 * of hash identiied layers on disk, and create a living running server with its own unique state and configuration.
 *
 * JavaScript runtimes (such as the browser and node) can leverage the same ideas, since everything
 * gets bundled as a module and served from a cache, and unique / site / deployment specific settings can be injected
 * into the DOM at the last minute (or loaded from the process in node) before booting the application using the 80% third party cached code and the
 * 20% unique code that is your application.
 *
 * Runtime can act as a base container, FROM which you build a unique container that can host any application
 * that can be be described as one or more entry points, which depend on common patterns of modules and components
 * whose implementations live inside of that project.  Imagine a React application
 *
 * layer 1:
 *
 *  - react
 *  - react-dom
 *  - react-router-dom
 *
 * layer 2:
 *  - bootstrap css
 *  - site theme
 *  - project specific dependencies (e.g. google maps, firebase )
 *
 * layer 3:
 *   - pages / app functionality
 *
 * These layers not only represent the dependencies and which ones change the least,
 * they also represent isolated modules that somebody can focus on independently of the others.
 *
 * The Helper class defines some type of component module in the application, and the runtime activates
 * these components using common APIs.  This allows us to express entire compositions of module
 * loading and activation in a declarative way (we can even write skypager applications using JSX)
 *
 * You can write many different applications and re-use layer 1 and layer 2 as long as they never change,
 * just as Dockerfiles let us share a base ubuntu linux image and spawn 100s of unique servers with their own
 * environments, state, and configuration.
 */
export class Runtime extends Entity {
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
    const { isFunction, isPlainObject } = this.lodash

    if (extension.isHelper && isFunction(extension.attach)) {
      extension.attach.call(this, this, options)
      return this
    } else if (isPlainObject(extension) && isFunction(extension.attach)) {
      extension.attach.call(this, this, options)
      return this
    }
  }

  createHelper(HelperClass, options = {}, context = {}) {
    return HelperClass.create(options, {
      runtime: this,
      ...this.context,
      ...context,
    })
  }
}

export default Runtime
