import Helper from './Helper'
import { types } from './PropTypes'
import { applyInterface } from './utils/prop-utils'

/**
 * The Feature Class provides an API on top of specific / named sets of functionality (e.g. logging, authentication,
 * speech recognition, whatever. )  These Features may or may not be supported on every platform, they may or
 * may not be enabled in every environment your application runs in, they may not be available for all users
 * based on roles and permissions or payment plans or whatever logic you need to express in your application.
 *
 * The Feature provides a unique, named service for whatever it is.
 *
 * runtime.auth, runtime.speech, runtime.geolocation, etc.
 *
 * Features can be registered with the runtime's Feature registry.  This allows you to query and see
 * all of the available features the runtime is aware of.  The runtime also keeps track of all of the
 * features which have been enabled.
 *
 * Each feature can, generally, be though of as a code splitting point as well.
 */
export class Feature extends Helper {
  static defaultProvider = {
    mixinOptions() {
      return {
        partial: [this.context],
        insertOptions: true,
        transformKeys: true,
        scope: this,
        hidden: false,
        configurable: true,
      }
    },
  }

  static providerTypes = {
    /**
     * When using a object provider type (as opposed to a class) you should export an array
     * of export names which will be treated as feature methods.  Feature methods are bound
     * to the instance of the feature object, and are partially applied with the feature context
     * object as the last argument.
     */
    featureMethods: types.arrayOf(types.string),
    featureWasEnabled: types.func,
    checkSupport: types.func,
    mixinOptions: types.oneOf([
      types.func,
      types.shape({
        partial: types.array,
        transformKeys: types.bool,
        right: types.bool,
        insertOptions: types.bool,
      }),
    ]),
  }

  /**
   * If you subclass Feature and require additional features or settings already available in your runtime,
   * you can override this and implement your own logic.
   */
  static isValidRuntime(runtime) {
    return super.isValidRuntime(runtime)
  }

  /**
   * When you first create an instance of a feature with whatever options, anywhere else in your code
   * where you attempt to initialize that feature with the same options, you will get the same instance
   * with the same state.
   */
  static isCacheable = true

  static registryName = 'features'

  static factoryName = 'feature'

  static get isFeature() {
    return true
  }

  constructor(options = {}, context = {}) {
    super(options, context)

    this.applyInterface(this.mixin, this.mixinOptions)

    this.enable = enableFeature(this, this.enable)
  }

  get hasErrors() {
    const { isEmpty } = this.lodash
    return !isEmpty(this.state.get('errors'))
  }

  /**
   * Returns true
   */
  get isEnabled() {
    return !!this.state.get('enabled')
  }

  get isSupported() {
    return !!this.state.get('isSupported')
  }

  /**
   * Takes any object of functions, and binds them to this instance of the Feature.
   *
   * This dynamic interface creation at runtime is a big responsibility of the feature class.
   *
   * If you don't wish to bind, or you wish to use arrow functions, the interface methods will
   * by default have this.context passed in as the last argument.
   */
  applyInterface(methods = {}, mixinOptions = this.mixinOptions) {
    applyInterface(this, methods, mixinOptions)
    return this
  }

  /**
   * Returns an object that contains the named set of functions on the feature module
   * implementation.  This object of functions will be applied as an interface to this feature
   * interface, which injects this features settings and state as bound this, or as the last context argument
   * passed to the function.
   *
   * @type {Object}
   */
  get mixin() {
    const { methods = this.impl.featureMethods || [] } = this.impl
    return methods.reduce(
      (memo, method) => ({
        ...memo,
        ...(typeof this.impl[method] === 'function' && { [method]: this.impl[method] }),
      }),
      {}
    )
  }

  /**
   * Controls how the mixin will behave (e.g. use partialRight to add this.context, transform get/lazy to those property types )
   */
  get mixinOptions() {
    const { mixinOptions = this.impl.featureMixinOptions } = this.impl
    return typeof mixinOptions === 'function'
      ? mixinOptions.call(this, this)
      : mixinOptions || this.constructor.defaultProvider.mixinOptions.call(this, this)
  }

  /**
   * Returns an object that contains the named set of functions on the feature module
   * implementation, which are intended to be added to the runtime itself instead of the feature.
   *
   * This object of functions will be applied as an interface to the runtime.
   *
   * @type {Object}
   */
  get hostMixin() {
    const { hostMethods = this.impl.runtimeMethods || [] } = this.impl

    return hostMethods.reduce(
      (memo, method) => ({
        ...memo,
        ...(typeof this.impl[method] === 'function' && { [method]: this.impl[method] }),
      }),
      {}
    )
  }

  /**
   * Controls how the host mixin will behave (e.g. use partialRight to add this.context, transform get/lazy to those property types )
   */
  get hostMixinOptions() {
    const { hostMixinOptions = this.impl.runtimeMixinOptions } = this.impl

    return typeof hostMixinOptions === 'function'
      ? hostMixinOptions.call(this, this)
      : hostMixinOptions || {
          ...this.mixinOptions,
          scope: this.runtime,
          partial: [{ ...this.runtime.context, ...this.context }],
        }
  }

  /**
   * Enabling a feature is an opportunity to kick off whichever operation is required
   * to turn this feature on (maybe loading external dependencies from a CDN, connecting to a service, etc).
   *
   * You're in control of calling this function,
   */
  enable(options = {}, callback) {
    return this
  }

  disable() {
    return this  
  }

  /**
   * Your feature can specify whether it is supported or not, by using whichever feature detection
   * techniques you want (are we in a browser, does the browser have this API? are we in node? development or production?)
   */
  async checkSupport() {
    return true
  }

  /**
   * The Runtime automatically creates a features registry and factory function, so there isn't any point
   * in doing that here.  Instead we override it so you can subclass a Feature and say runtime.use(MySubclass)
   * and this will give you the chance to register the feature ( so other instances of the runtime can also use it ) and enable it.
   *
   * Enabling a feature can usually create a reference to that feature on the runtime.
   */
  static attach(host, options = {}) {
    host.features.register(host.componentName, () => this)
    Promise.resolve(host.feature(host.componentName, options).enable())
  }
}

export function attach(host, options = {}) {
  return Feature.attach(host, options)
}

export default Feature

export function enableFeature(feature, enableFunction = feature.enable) {
  const hook = feature.impl.featureWasEnabled

  return enabler.bind(feature)

  async function enabler(options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = feature.options
    }

    if (typeof callback !== 'function') {
      callback = () => {}
    }

    try {
      const isSupported = await feature.checkSupport().catch(error => false)

      feature.state.set('isSupported', isSupported)

      if (!isSupported) {
        throw new Error(`${feature.toString()} is not supported by this runtime.`)
      }

      applyInterface(feature.runtime, feature.hostMixin, feature.hostMixinOptions)
      await enableFunction.call(feature, options, callback)

      if (typeof hook === 'function') {
        await Promise.resolve(hook.call(feature, options, feature.context))
      }

      await new Promise(resolve => {
        feature.setState({ enabled: true }, () => {
          feature.runtime.emit('featureWasEnabled', feature)
          callback(null, feature)
          resolve()
        })
      })
    } catch (error) {
      this.error(`${feature.toString()} failed to enable`, error)

      await new Promise(resolve => {
        feature.setState({ enabled: false, error: error.message }, () => {
          feature.runtime.emit('featureFailedToEnable', feature)
          resolve()
          callback(error)
        })
      })

      throw error
    }
  }
}
