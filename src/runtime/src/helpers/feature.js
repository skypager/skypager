import Helper from './helper.js'

const isFunction = o => typeof o === 'function'

/**
 * @class Feature
 * @extends Helper
 * @classdesc The Feature Class is used to provide an interface to something which can be
 * enaabled() and optionally configured() and possibly even have persistent state
 * throughout their object lifecyle.  Extended runtimes such as @skypager/node
 * are just a normal runtime which packages certain node specific features
 * and enable them automatically.
 */
export class Feature extends Helper {
  static isSkypagerHelper = true

  /**
   * This lets you create feature instances using the `runtime.feature` factory method
   * without first registering the module with the `runtime.features` registry.
   */
  static allowAnonymousProviders = true

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
   *
   */
  static createRegistry(...args) {
    const reg = Helper.createContextRegistry('features', {
      context: Helper.createMockContext({}),
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
    runtime.Feature = this

    const result = Helper.attach(runtime, Feature, {
      registryProp: 'features',
      lookupProp: 'feature',
      cacheHelper: true,
      isCacheable: true,
      registry: Feature.registry,
      ...options,
    })

    if (runtime.makeObservable && !runtime.has('featureStatus')) {
      runtime.makeObservable({ featureStatus: ['shallowMap', {}] })
    }

    return result
  }

  /**
   * @private
   */
  initialize() {
    this.applyInterface(this.featureMixin, this.featureMixinOptions)
  }

  get featureMixinOptions() {
    const { defaults } = this.lodash
    const opts = this.tryResult('featureMixinOptions') || this.tryResult('mixinOptions') || {}
    return defaults({}, opts, this.defaultMixinOptions)
  }

  get hostMixinOptions() {
    const { defaults } = this.lodash
    const opts = this.tryResult('hostMixinOptions') || this.tryResult('mixinOptions') || {}
    return defaults({}, { scope: this.host }, opts, this.defaultMixinOptions)
  }

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
   * @param {object|function}
   *
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

    /**
     * @property {Object} featureSettings contains the settings or configuration for this feature based on how it was initialized and created
     */
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
    return this.tryResult('runtimeMethods', () => this.hostMethods)
  }

  get hostMethods() {
    return this.tryResult('projectMethods', this.tryResult('hostMethods', []))
  }

  get projectMethods() {
    return this.tryResult('projectMethods', this.tryResult('hostMethods', []))
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
