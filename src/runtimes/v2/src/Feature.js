import Helper from './Helper'
import { types } from './PropTypes'

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

  static providerTypes = {
    /** 
     * When using a object provider type (as opposed to a class) you should export an array
     * of export names which will be treated as feature methods.  Feature methods are bound
     * to the instance of the feature object, and are partially applied with the feature context
     * object as the last argument.
    */
    featureMethods: types.arrayOf(types.string),
    featureWasEnabled: types.func,
    checkSupport: types.func
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
  }

  get hasErrors() {
    const { isEmpty } = this.lodash
    return !isEmpty(this.state.get('errors'))
  }

  /** 
   * Returns true
  */
  get isEnabled() {
    return this.state.get('isEnabled')
  }

  get isSupported() {
    return this.state.get('isSupported')  
  }

  /** 
   * Enabling a feature is an opportunity to kick off whichever operation is required
   * to turn this feature on (maybe loading external dependencies from a CDN, connecting to a service, etc).
   * 
   * You're in control of firing this event, 
  */
  enable() {

  }

  /** 
   * Your feature can specify whether it is supported or not, by using whichever feature detection
   * techniques you want (are we in a browser, does the browser have this API? are we in node? development or production?)
  */
  async checkSupport() {
    return true
  }
}

function runEnableHook(feature) {

}

export function attach(host, options = {}) {
  return Feature.attach(host, options)
}

export default Feature
