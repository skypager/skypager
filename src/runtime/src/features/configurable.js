export const hostMethods = ["lazyConfigFeatures", "lazyConfigReducers", "lazyConfigPresets", "lazyConfigBuilder"]

export function configurator(options = {}) {
  if (this.builder) {
    return this.builder
  }

  const { baseConfig = this.tryGet("baseConfig", {}), scope = this, tap = this.tryGet("tapConfig") } = options

  const features = this.buildConfigFeatures(options.features)
  const reducers = this.getConfigReducersObject(options.reducers)
  const presets = this.getConfigPresetsObject(options.presets)

  return configBuilder.call(this, {
    features,
    reducers,
    history: this.configHistory,
    scope,
    tap,
    baseConfig,
    onStash: (...a) => this.emit("config:stashed", ...a),
    onReset: (...a) => this.emit("config:reset", ...a),
    ...options,
  })
}

export function getConfigKeysFn() {
  return (v, k) => stringUtils.pluralize(k)
}

export function stringifyConfig() {
  return this.config.toString()
}

export function buildConfigFeatures(passed = {}) {
  let options = this.options.configFeatures || (c => ({}))
  let mine = this.configFeatures || (c => ({}))
  let constructors = this.constructor.configFeatures || (c => ({}))

  options = isFunction(options) ? options.call(this, this.options, this.context) : options || {}

  constructors = isFunction(constructors) ? constructors.call(this, this.options, this.context) : constructors || {}

  mine = isFunction(mine) ? mine.call(this, this.options, this.context) : mine || {}

  return Object.assign({}, constructors, mine, options, passed)
}

export function getConfigFeatures(passed = {}) {
  const base = omitBy(this.buildConfigFeatures(passed), v => !isFunction(v))
  return mapValues(base, fn => fn.bind(this))
}

export function getConfigReducersObject(passed = {}) {
  let options = this.options.configReducers || (c => ({}))
  let mine = this.configReducers || (c => ({}))
  let constructors = this.constructor.configReducers || (c => ({}))

  options = isFunction(options) ? options.call(this, this.options, this.context) : options || {}

  constructors = isFunction(constructors) ? constructors.call(this, this.options, this.context) : constructors || {}

  mine = isFunction(mine) ? mine.call(this, this.options, this.context) : mine || {}

  return Object.assign({}, constructors, mine, options, passed)
}

export function getConfigReducers(passed = {}) {
  const base = omitBy(this.getConfigReducersObject(passed), v => !isFunction(v))
  return mapValues(base, fn => fn.bind(this))
}
