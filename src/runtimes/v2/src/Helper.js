import Entity from './Entity'
import Registry from './Registry'
import { Runtime } from './Runtime'
import { getter, hideGetter } from './utils/prop-utils'
import types, { check as checkTypes } from './PropTypes'
// import { nonenumerable, nonconfigurable } from 'core-decorators'

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
  static isHelper = true

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

  get optionTypes() {
    return this.constructor.optionTypes
  }

  /**
   * An object of prop-types.  This will be used to validate the context this Helper is instantiated
   * with at runtime.  Context is usually automatically passed down and you don't have to worry about it.
   *
   * Runtimes and Helpers can define their own getChildContext() functions which need to be validated.
   */
  static contextTypes = {}

  get contextTypes() {
    return this.constructor.contextTypes
  }

  /**
   * An object of prop-types. Whenever modules of this type are registered with the Helper registry, we can validate the
   * export properties against the prop-types declared here.
   */
  static providerTypes = {}

  get providerTypes() {
    return this.constructor.providerTypes
  }

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

    if (!this.constructor.isValidRuntime(runtime)) {
      throw new InvalidRuntimeError(this.constructor.name)
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

  /**
   * Component name will be whatever the Helper instance options.name,
   * provider.name, or class constructor name is.
   *
   * @type {String}
   */
  get componentName() {
    const { name = this.provider && this.provider.name } = this.options
    return name || this.constructor.name
  }

  /**
   * @private
   */
  checkTypes(location) {
    return Helper.checkTypes(this, location, {
      componentName: this.componentName,
    })
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

  get(path, defaultValue) {
    return this.lodash.get(this, path, defaultValue)
  }

  result(path, defaultValue) {
    return this.lodash.result(this, path, defaultValue)
  }

  tryGet() {}

  tryResult() {}

  /**
   * Helper classes are designed to be attached to an instance of Runtime,
   * or to another helper instance (e.g. an instance of Server might depend on Feature or Endpoint helpers)
   *
   * If you're using the runtime.use(Helper) API, it will look for an attach function and pass an instance
   * of the runtime as a first argument, and any options as the second.
   *
   * When a Helper attaches itself to something, it does two things:
   *
   * 1) creates a factory function, which creates instances of Helper with a context argument that is used to
   *    link to the runtime's dependency injection, event bus, and global state functions
   *
   * 2) creates a Registry, where the providers / implementations of a Helper can register themselves. This
   *    allows developers to create instances of that helper (e.g. an instance Server you want to start) by
   *    name
   *
   *
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

    const { async = HelperClass.asyncMode } = options
    const { host, runtime = host } = context

    if (typeof runtime === 'undefined') {
      throw new InvalidRuntimeError(HelperClass.name)
    }

    let { provider = HelperClass.defaultProvider } = options

    if (async) {
      return Promise.resolve(provider).then(resolved =>
        this.create({ ...options, provider: resolved, async: false }, context)
      )
    }

    /**
     * If the HelperClass is in strict mode, you won't even be able to
     * create an instance without the valid options, context, provider values
     * known ahead of time.  You can use helperInstance.checkTypes() after it is
     * created to handle errors more gracefully (if e.g. certain values cant be truly validated
     * until runtime code is executed.)
     */
    if (HelperClass.strictMode) {
      const subject = {
        provider,
        options,
        context,
        optionTypes: HelperClass.optionTypes,
        contextTypes: HelperClass.contextTypes,
        providerTypes: HelperClass.providerTypes,
        componentName: options.name || provider.name || HelperClass.name,
      }

      const optionsResults = HelperClass.checkTypes(subject, 'options')
      const providerResults = HelperClass.checkTypes(subject, 'provider')
      const contextResults = HelperClass.checkTypes(subject, 'context')

      if (!optionsResults.pass) {
        throw new InvalidOptions(optionsResults)
      }
      if (!providerResults.pass) {
        throw new InvalidProvider(providerResults)
      }
      if (!contextResults.pass) {
        throw new InvalidContext(contextResults)
      }
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

  /**
   * You can override this in your own Helper, if you have your own requirements of the runtime
   * (e.g. certain features need to be enabled, can only run in node, etc.)
   */
  static isValidRuntime(runtime) {
    return !!checkTypes({ runtime }, { runtime: types.runtime }).pass
  }

  /**
   * Use type specifications (named prop-types) to test an object for
   * supplying the appropriate values.  Helper instances have
   *
   * - options (what the developer creates them with)
   * - context (what the framework automatically passes down)
   * - provider (what the underlying provider module is expected to include in its exports)
   *
   * This function can be used to test all three:
   *
   * Helper.checkTypes(instance, 'options')
   *
   * @param {Object} subject the object whose properties you want to validate.
   * @param {String} location the name of the (whatever)Types property that contains the type specs
   * @param {Object} options options
   * @param {String} [options.componentName=subject.componentName] the name of the component who is being tested
   */
  static checkTypes(subject, location, options = {}) {
    const key = `${location.replace(/s$/, '')}Types`
    let typeSpecs = subject[key]

    const report = checkTypes(subject[location], typeSpecs, {
      componentName:
        options.componentName ||
        subject.componentName ||
        subject.name ||
        (subject.constructor && subject.constructor.name),
      ...options,
      location,
    })

    return {
      ...report,
      typeSpecs,
      location,
      subject,
    }
  }
}

export class InvalidProvider extends Error {
  constructor({ result }) {
    super(result)
  }
}

export class InvalidContext extends Error {
  constructor({ result }) {
    super(result)
  }
}

export class InvalidOptions extends Error {
  constructor({ result }) {
    super(result)
  }
}
/**
 * This error will get thrown if when somebody uses the Helper class constructor
 * directly, they forget to pass the host / runtime context as a second argument.  Generally
 * you shouldn't create helper instances directly, but use the attach API and its factory
 * functions instead (e.g. runtime.server("app", { port: 3000 }) instead of new Server({ port: 3000, name: "app" }, { runtime }))
 */
export class InvalidRuntimeError extends Error {
  constructor(helperClassName) {
    super(
      `Could not find a reference to the parent runtime in the context argument that was passed to the constructor of ${helperClassName}.  If you are calling ${helperClassName}.create or new ${helperClassName}() make sure to pass options, and context.  Context needs to have a reference to the parent runtime.`
    )
  }
}

export { types, checkTypes }

export default Helper

const runtimes = new WeakMap()
