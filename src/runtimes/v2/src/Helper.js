import Entity from './Entity'
import Registry from './Registry'
import { Runtime } from './Runtime'
import { getter, hideGetter } from './utils/prop-utils'
import types, { check as checkTypes } from './PropTypes'

/**
 * The Helper class defines a module type, or pattern.  A module is any JavaScript object that is loaded once,
 * and cached in memory so that subsequent requires of that module are instant.  A module type or pattern simply states,
 * this module can have exports named a, b, and c.  It must have exports named x, y, and z.  Additionally,
 * export a should be a function, export b should be a number, etc.
 *
 * It takes as part of its constructor, an arbitrary shaped object, called 'provider'
 *
 * These objects can be any individual JavaScript module, whether a single
 * file, a directory, a package on npm, a web assembly module built in rust.  These modules "provide" the implementation of
 * a Helpers defined hook functions.  Typically you'll have folders in your JavaScript project,
 * clients, pages, features, servers, etc.  A Helper can be used to load all of these modules in
 * a consistent way.
 *
 * The Helper class will use its knowledge about the module's shape (which properties it can or must export)
 * to build any common, universal interface for working with all modules of this type.
 *
 * A hypothetical example would be a Server Helper which any consumer can just
 *
 * - start()
 * - stop()
 * - configure()
 *
 * This adapter pattern can be used to incorporate literally any implementation of
 * a server process in node.js, without having the consumer care about the particular
 * details of how express, hapi, feathers, etc do these things under the hood.
 *
 * You can wrap every server API there is with this one common interface. Helpers allow us to
 * define project components and standardize the way they are composed into a larger application.
 *
 * Helpers can attach a function, a.k.a a factory, to the runtime singleton.  For example,
 * a server function which creates instances of server helpers powered by express, hapi, or whatever.
 *
 */
export class Helper extends Entity {
  /**
   * This is used to identify that this is a Helper.  When you subclass Helper,
   * this will still return true and allow us to identify when Helper subclasses
   * are registered with the parent Helper class' registry.  This should still work,
   * we will just make sure to create an instance of the subclass in the factory function.
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

    const withoutProvider = Object.keys(options).reduce(
      (memo, prop) => ({
        ...memo,
        ...(prop !== 'provider' && { [prop]: options[prop] }),
      }),
      {}
    )

    super(withoutProvider)

    runtimes.set(this, context.runtime)

    this._context = context
    hideGetter(this, '_context', () => context)

    this._provider = provider
    hideGetter(this, '_provider', () => provider)

    const baseClass = this.constructor

    if (baseClass.isObservable) {
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

  static createRegistry(options = {}) {
    return new Registry(options)
  }
}

export default Helper

const runtimes = new WeakMap()
