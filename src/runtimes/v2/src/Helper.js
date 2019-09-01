import Entity from './Entity'
import Registry from './Registry'
import { Runtime } from './Runtime'
import { getter, hideGetter } from './utils/prop-utils'
import types, { check as checkTypes } from './PropTypes'


export class Helper extends Entity {
  /**
   * This is used to identify that this is a Helper.  When you subclass Helper,
   * this will still return true and allow us to identify when Helper subclasses
   * are registered with the parent Helper class' registry.  This should still work,
   * we will just make sure to create an instance of the subclass in the factory function.
   * 
   * This enables e.g. the Feature class providers to subclass Feature.  The way you might
   * subclass React.Component.
   */
  static get isHelper() {
    return true
  }

  /**
   * Helpers which operate in strict mode will validate the options, provider, and context
   * types at time of creation, and throw an error if there are any missing or non-conforming values
   * being passed.  Helpers which don't operate in strict mode can get results for warning purposes still.
   *
   */
  static strictMode = false

  /**
   * Helpers which operate in async mode may have providers that exist as async functions
   * which resolve to the module (e.g. when using dynamic import or react-loadable). When
   * this is turned on, the factory function will return a promise with the helper instance
   * set with the resolved module as its provider.
   */
  static asyncMode = false

  /**
   * Helpers which are cacheable will have factory functions which use a hash of the options
   * being passed as a cache key.  Multiple calls to the factory function with the same options
   * object, will return the same instance.  Helpers which are not cacheable will always return
   * a new instance from the factory function.
   */
  static isCacheable = true

  /**
   * Helpers which are observable will fire events automatically whenever state changes.
   */
  static isObservable = false

  /**
   * Whenever an instance of the Helper is created, default options can be set.
   */
  static defaultOptions = {}

  /**
   * Whenever an instance of the Helper is created, default provider properties can be set.
   */
  static defaultProvider = {}

  /**
   * An object of prop-types.  This will be used to validate the options this Helper is instantiated
   * with at runtime.
   */
  static optionTypes = {}

  /**
   * An object of prop-types.  This will be used to validate the context this Helper is instantiated
   * with at runtime.  Context is usually automatically passed down and you don't have to worry about it.
   *
   * Runtimes and Helpers can define their own getChildContext() functions which need to be validated.
   */
  static contextTypes = {}

  /**
   * An object of prop-types. Whenever modules of this type are registered with the Helper registry, we can validate the
   * export properties against the prop-types declared here.
   */
  static providerTypes = {}

  constructor(options = {}, context = {}) {
    const { provider = {} } = options
    const { host, runtime = host } = context

    const withoutProvider = Object.keys(options).reduce(
      (memo, prop) => ({
        ...memo,
        ...(prop !== 'provider' && { [prop]: options[prop] }),
      }),
      {}
    )

    super(withoutProvider)

    if (!this.constructor.isValidRuntime(runtime).pass) {
      throw new InvalidRuntimeError()
    }

    runtimes.set(this, runtime)

    this._context = context
    hideGetter(this, '_context', () => context)

    this._provider = Object.assign({}, provider)
    hideGetter(this, '_provider', () => provider)

    if (this.constructor.isObservable) {
      setTimeout(() => this.startObservingState(), 0)
    }
  }

  get componentName() {
    return this.constructor.name
  }

  /**
   * @private
   */
  checkTypes(location) {
    return Helper.checkTypes(this, location)
  }


  /** 
   * A Helper can dynamically modify the provider object it was created with.  This can be useful to,
   * for example, wrap certain provider hooks or methods with logging or profiling, or to delegate similar
   * functionality (e.g login / logout) to different providers of that service.
  */
  set provider(patch) {
    Object.assign(this._provider, patch)
  }

  /** 
   * Dynamic method delegation.
   * 
   * When a helper is created against a module in a helper registry, this cached module object
   * is referred to as the helper's provider.  This object will contain functions that a helper
   * can delegate responsibility to.  An Authentication feature can provide a single `login` function
   * that works with all of the different auth providers, or an  EmailNotification feature can provide
   * a single `sendEmail` function that works with all the things.
   * 
   * The provider is the "private" implementation.  The Helper is the public API.
  */
  get provider() {
    return {
      ...this.constructor.defaultProvider,
      ...this._provider,
    }
  }

  /**
   * The Context object can be used as the last argument to provider implementation hooks
   */
  get context() {
    const helper = this
    const { runtime } = this

    return {
      ...this._context,
      get runtime() {
        return runtime
      },
      get me() {
        return helper
      },
      get my() {
        return helper
      },
    }
  }

  /**
   * Every instance of the helper class is associated with a particular runtime instance.
   * The link to the runtime acts as a global event bus, shared state machine, and dependency
   * injection service for all instances of the helpers.
   */
  get runtime() {
    return runtimes.get(this)
  }

  get lodash() {
    return this.runtime.lodash
  }

  get chain() {
    return this.runtime.lodash.chain(this)
  }

  get(path, defaultValue) {
    return this.lodash.get(this, path, defaultValue)
  }

  result(path, defaultValue) {
    return this.lodash.result(this, path, defaultValue)
  }

  tryGet() {}

  tryResult() {}

  /**
   * Cr
   * @name attach
   * @param {Entity} entity
   * @param {Object} [options={}]
   */
  static attach(entity, options = {}) {
    const {
      registryName = String(this.name).toLowerCase() + 's',
      factoryName = String(this.name).toLowerCase(),
    } = options

    const {
      registry = this.createRegistry({ host: entity, ...options }),
      factory = this.createFactory({ host: entity, registry, ...options }),
    } = options

    getter(entity, registryName, () => registry)
    getter(entity, factoryName, () => factory)

    return entity
  }

  /**
   * Creates an instance of the Helper class and validates the
   * options, provider, and context properties match any types declared
   * as static properties of the Helper class.
   */
  static create(options = {}, context = {}) {
    const HelperClass = this

    let { provider = HelperClass.defaultProvider } = options

    if (HelperClass.asyncMode) {
      return Promise.resolve(provider).then(resolved => {
        return new HelperClass({
          provider: resolved,
          ...options,
        })
      })
    }

    const instance = new HelperClass(options, context)

    return instance
  }

  /**
   * Returns a function which will create instances of the Helper class
   * with the context argument populated with a reference to the helper's
   * parent runtime container.
   *  
   * @param {Object} options
   * @param {Registry} [options.registry]
   * @param {Helper|Runtime} [options.host]
   * @param {Function} [options.create]
   *
   * @returns {Function}
   */
  static createFactory(options = {}) {
    const { host, registry, create = this.create } = options
    const baseFactory = create.bind(this)

    return (moduleId, o = {}, c = {}) => {
      const provider = registry.lookup(moduleId)
      return baseFactory(
        { provider, ...o },
        {
          runtime: host.runtime,
          host,
          ...host.context,
          ...c,
        }
      )
    }
  }

  /** 
   * A Helper registry is an observable, queryable database that contains information
   * about all of the available modules that are of the same Helper type.  You might have
   * a Registry that has information about all of the servers you have available to you,
   * or a Registry that has information about all the clients or features, etc. 
   * 
   * @param {Object} options
   * @param {Function} [options.formatId] a function which will format the ID to a standard format.
   * @returns {Registry}
  */
  static createRegistry(options = {}) {
    return new Registry(options)
  }
  
  static get types() {
    return types
  }

  static isValidRuntime(runtime) {
    return checkTypes({ runtime }, { runtime: types.runtime })
  }

  /**
   * @private
   */
  static checkTypes(subject, location, options = {}) {
    let typeSpecs = subject[`${location}Types`]

    return checkTypes(subject, typeSpecs, {
      componentName:
        subject.componentName || subject.name || (subject.constructor && subject.constructor.name),
      ...options,
      location,
    })
  }

}

export class InvalidRuntimeError extends Error {}

export { types, checkTypes }

export default Helper

const runtimes = new WeakMap()