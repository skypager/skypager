import Helper from './helper.js'

const isFunction = o => typeof o === 'function'

export class Feature extends Helper {
  static isCacheable = true

  static createRegistry(...args) {
    const reg = Helper.createContextRegistry('features', {
      context: require.context('../features', false, /\.js$/),
    })

    reg.enabled = {}

    return reg
  }

  static attach(project, options = {}) {
    const result = Helper.attach(project, Feature, {
      registryProp: 'features',
      lookupProp: 'feature',
      cacheHelper: true,
      isCacheable: true,
      registry: Feature.registry,
      ...options,
    })

    if (project.makeObservable && !project.has('featureStatus')) {
      project.makeObservable({ featureStatus: ['shallowMap', {}] })
    }

    return result
  }

  initialize() {
    this.applyInterface(this.featureMixin, this.featureMixinOptions)
  }

  setInitialState(initialState = {}) {
    const { defaultsDeep } = this.lodash

    if (this.state && this.tryGet('initialState')) {
      Promise.resolve(this.attemptMethodAsync('initialState'))
        .then(i => {
          if (typeof i === 'object') {
            this.state.merge(defaultsDeep({}, i, initialState))
          }
        })
        .catch(error => {
          console.error('Error setting initial state', this, error)
          this.initialStateError = error
        })
    }
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
    }
  }

  enable(cfg) {
    const { runtime } = this

    if (
      runtime.isFeatureEnabled(this.name) &&
      runtime.get(`enabledFeatures.${this.name}.cacheKey`) === this.cacheKey
    ) {
      // this.runtime.debug(`Attempting to enable ${this.name} after it has already been enabled.`)
      return this
    }

    if (typeof cfg === 'object') {
      const { options = {} } = this
      const { defaultsDeep: defaults } = this.runtime.lodash
      this.set('options', defaults({}, cfg, options))
    } else if (isFunction(cfg)) {
      this.configure(cfg.bind(this))
    }

    try {
      this.host.applyInterface(this.hostMixin, this.hostMixinOptions)
    } catch (error) {}

    this.attemptMethodAsync('featureWasEnabled', cfg, this.options)
      .then(result => {
        this.runtime.featureStatus.set(this.name, {
          cacheKey: this.cacheKey,
          status: 'enabled',
          cfg,
          options: this.options,
        })
        return this
      })
      .catch(error => {
        this.runtime.featureStatus.set(this.name, {
          status: 'failed',
          error,
          cacheKey: this.cacheKey,
          cfg,
          options: this.options,
        })
        this.runtime.error(`Error while enabling feature`, feature, error)
        return this
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
      `runtime.config.features.${cased}`,
      `runtime.argv.${this.name}`,
      `runtime.projectConfig.${this.name}`,
      `runtime.options.${this.name}`,
      `runtime.config.${this.name}`,
      `runtime.argv.${cased}`,
      `runtime.projectConfig.${cased}`,
      `runtime.options.${cased}`,
      `runtime.config.${cased}`,
    ])
  }
}

export default Feature

export const isCacheable = true

export const attach = Feature.attach

Feature.registry = Feature.createRegistry()
