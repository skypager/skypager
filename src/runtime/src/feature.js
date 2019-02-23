import Helper from './helper.js'

const isFunction = o => typeof o === 'function'

/**
 * @typedef {import("./runtime").Runtime} Runtime
 */

/**
 * @typedef {import("./utils.properties").Mixin} Mixin
 */

/**
 * @typedef {import("./utils.properties").MixinOptions} MixinOptions
 */

/**
 * @class Feature
 * @extends Helper
 * @classdesc The Feature Class is used to provide an interface to something which can be
 * enaabled() and optionally configured() and possibly even have persistent state
 * throughout their object lifecyle.  Extended runtimes such as @skypager/node
 * are just a normal runtime which packages certain node specific features
 * and enable them automatically.
 */

/**
 * The options this feature was created with, combined with the options it was enabled with.
 * @name featureSettings
 * @type {Object}
 * @memberof Feature#
 */
export class Feature extends Helper {
  /**
   * This lets you create feature instances using the `runtime.feature` factory method
   * without first registering the module with the `runtime.features` registry.
   */
  static allowAnonymousProviders = false

  /**
   * Since features are cacheable, you will get the same instance of the feature back
   * every time you call the `runtime.feature` factory method with the same arguments
   *
   * @example
   *
   *  const one = runtime.feature('my-feature')
   *  const two = runtime.feature('my-feature')
   *  const three = runtime.feature('my-feature', { cacheHelper: false })
   *
   *  console.assert(one.uuid === two.uuid)
   *  console.assert(three.uuid !== two.uuid)
   */
  static isCacheable = true

  /**
   * Creates a Feature registry.
   *
   * @param {Object} options options for the context registry
   * @param {String} [options.name='features'] the name of the registry
   * @param {Object<String,Function>} [options.features={}] items to populate the registry with
   *
   * @returns {ContextRegistry}
   */
  static createRegistry(options = {}) {
    const reg = Helper.createContextRegistry(options.name || 'features', {
      context: Helper.createMockContext(options.features || {}),
      ...options,
    })

    reg.enabled = {}

    return reg
  }

  /**
   * Attaches this helper class to a runtime.
   *
   * @param {Runtime} runtime the runtime to attach the Feature registry to
   * @param {Object} options options to pass through to `Helper.attach`
   * @param {String} [options.lookupProp='feature'] the name of the factory function to create on the runtime
   * @param {String} [options.registryProp='features'] the name of the registry prop to create on the runtime
   * @returns {Runtime}
   */
  static attach(runtime, options = {}) {
    const result = Helper.attach(runtime, Feature, {
      registryProp: '_features',
      lookupProp: '_feature',
      cacheHelper: true,
      isCacheable: true,
      registry: Feature.registry,
      ...options,
    })

    return result
  }

  /**
   * @private
   */
  afterInitialize() {
    this.applyInterface(this.featureMixin, this.featureMixinOptions)
  }

  /**
   * A Feature helper can define a featureMixinOptions or mixinOptions property
   * which is used to control the behavior of the interface that gets built for the feature.
   * This is based on @skypager/runtime/src/utils/properties applyInterface method, which takes
   * an object of functions and binds it to the target object, which in this case is the feature instance,
   * and automatically appends the runtime context as the last argument to every function.
   *
   * This is only useful for module of function style feature helpers, and is not needed so much
   * for class based Features.
   *
   * @readonly
   * @memberof Feature
   */
  get featureMixinOptions() {
    const { defaults } = this.lodash
    const opts = this.tryResult('featureMixinOptions') || this.tryResult('mixinOptions') || {}
    return defaults({}, opts, this.defaultMixinOptions)
  }

  /**
   * A Feature Helper which defines a runtime or host mixin will extend the runtime with
   * the specified functions / properties.  The hostMixinOptions controls the binding, and argument
   * signature of these functions, similar to featureMixinOptions
   *
   * @readonly
   * @memberof Feature
   */
  get hostMixinOptions() {
    const { defaults } = this.lodash
    const opts = this.tryResult('hostMixinOptions') || this.tryResult('mixinOptions') || {}
    return defaults({}, { scope: this.host }, opts, this.defaultMixinOptions)
  }

  /**
   * The default mixin options that will be used when the feature doesn't declare its own.
   * These will be passed to the applyInterface calls for both feature and host mixins.
   *
   * @type {MixinOptions}
   * @readonly
   * @memberof Feature
   */
  get defaultMixinOptions() {
    return {
      transformKeys: true,
      scope: this,
      partial: [this.context],
      insertOptions: true,
      right: true,
      hidden: false,
      configurable: true,
    }
  }

  /**
   * Enable the feature.
   *
   * @param {Object} options options to enable this feature with
   * @param {Function} [callback] a callback that will get called when the feature is finished enabling.
   * @returns {PromiseLike<Feature>}
   */
  enable(options = {}, callback) {
    const { runtime } = this
    const { identity, isFunction, defaultsDeep } = this.lodash

    if (isFunction(options)) {
      callback = options
      options = {}
    }

    if (!isFunction(callback)) {
      callback = identity
    }

    if (
      runtime.isFeatureEnabled(this.name) &&
      runtime.get(`enabledFeatures.${this.name}.cacheKey`) === this.cacheKey
    ) {
      // this.runtime.debug(`Attempting to enable ${this.name} after it has already been enabled.`)
      callback(null, this)
      return this
    }

    try {
      this.hide('featureSettings', defaultsDeep({}, options, this.options), {
        configurable: true,
      })
    } catch (error) {}

    try {
      this.host.applyInterface(this.hostMixin, this.hostMixinOptions)
    } catch (error) {
      console.error('error applying host mixin', error)
      this.hostMixinError = error
    }

    const hook = () =>
      // this handles the class style
      this.featureWasEnabled
        ? Promise.resolve(this.featureWasEnabled(options))
        : // this handles the module style
          this.attemptMethodAsync('featureWasEnabled', options)

    return hook()
      .then(() => {
        this.runtime.featureStatus.set(this.name, {
          cacheKey: this.cacheKey,
          status: 'enabled',
          cfg: options,
          options: this.options,
        })

        callback(null, this)
        return this
      })
      .catch(error => {
        this.runtime.featureStatus.set(this.name, {
          status: 'failed',
          error,
          cacheKey: this.cacheKey,
          cfg: options,
          options: this.options,
        })
        this.runtime.error(`Error while enabling feature`, this, error.message)

        callback(error)

        throw error
      })
  }

  runMethod(methodName, ...args) {
    const method = this.tryGet(methodName, this.get(methodName))
    return isFunction(method) && method.call(this, ...args.push(this.context))
  }

  get hostMixin() {
    return this.projectMixin
  }

  get projectMixin() {
    return this.chain
      .get('hostMethods')
      .filter(m => isFunction(this.tryGet(m)))
      .keyBy(m => m)
      .mapValues(m => this.tryGet(m))
      .pickBy(v => isFunction(v))
      .value()
  }

  get featureMixin() {
    const hostMethods = this.hostMethods

    return this.chain
      .get('featureMethods')
      .filter(m => hostMethods.indexOf(m) === -1 && isFunction(this.tryGet(m)))
      .keyBy(m => m)
      .mapValues(m => this.tryGet(m))
      .pickBy(v => isFunction(v))
      .value()
  }

  get featureMethods() {
    return this.tryResult('featureMethods', [])
  }

  get runtimeMethods() {
    const { uniq, flatten } = this.lodash
    // need to consolidate on one name
    const hostMethods = this.tryGet('hostMethods', [])
    const runtimeMethods = this.tryGet('runtimeMethods', [])
    const projectMethods = this.tryGet('projectMethods', [])

    return uniq(flatten(hostMethods, runtimeMethods, projectMethods))
  }

  get hostMethods() {
    return this.runtimeMethods
  }

  get projectMethods() {
    return this.runtimeMethods
  }

  get dependencies() {
    return this.tryGet('dependencies', {})
  }

  get isSupported() {
    return this.tryResult('isSupported', true)
  }

  get projectConfigKeys() {
    const { uniq } = this.lodash
    const { camelCase, snakeCase } = this.runtime.stringUtils
    const cased = camelCase(snakeCase(this.name))

    return uniq([
      `runtime.argv.features.${this.name}`,
      `runtime.options.features.${this.name}`,
      `runtime.config.features.${this.name}`,
      `runtime.argv.features.${cased}`,
      `runtime.options.features.${cased}`,
      `runtime.argv.${this.name}`,
      `runtime.projectConfig.${this.name}`,
      `runtime.options.${this.name}`,
      `runtime.argv.${cased}`,
      `runtime.projectConfig.${cased}`,
      `runtime.options.${cased}`,
    ])
  }
}

export default Feature

export const isCacheable = true

export const attach = Feature.attach

Feature.registry = Feature.createRegistry()

Feature.isSkypagerFeature = true
