import pickBy from 'lodash/pickBy'
import mapValues from 'lodash/mapValues'
import partial from 'lodash/partial'
import isFunction from 'lodash/isFunction'
import camelCase from 'lodash/camelCase'
import lowerFirst from 'lodash/lowerFirst'

const { defineProperty } = Object

/**
 * Creates some functions that are useful when trying to decorate objects with hidden properties or getters,
 * or lazy loading properties, etc.  I use this a lot inside of constructor functions for singleton type objects.
 *
 * @param  {Object} target This is the object you intend to be decorating
 * @return {Object}        Returns an object with some wrapper functions around Object.defineProperty
 */
export function propertyUtils(target) {
  /**
   * @mixin PropertyUtils
   */
  const boundUtils = {
    /**
     * @link lazy
     */
    lazy: partial(lazy, target),
    /**
     * @link hideProperty
     */
    hide: partial(hideProperty, target),
    /**
     * @link hideProperty
     */
    hideProperty: partial(hideProperty, target),
    /**
     * @link hideProperty
     */
    hideGetter: partial(hideGetter, target),
    /**
     * @link hideProperty
     */
    hideProperties: partial(hideProperties, target),
    /**
     * @link hideProperty
     */
    getter: partial(getter, target),
    /**
     * @link hideProperty
     */
    applyInterface: partial(applyInterface, target),
  }

  return boundUtils
}

export const transformKey = key =>
  lowerFirst(camelCase(key.replace(new RegExp(`^(get|lazy)`, ''), '')))

export function createInterface(interfaceMethods = {}, options = {}) {
  const {
    // if the method is called with no args, it includes an empty hash.
    insertOptions = true,
    // apply partial
    partial = [],
    // apply partial right
    right = true,
    scope,
    defaultOptions = {},
  } = options

  // limit the interface to functions, and unless safe is set to false, non existing properties
  const interFace = mapValues(
    pickBy(interfaceMethods, isFunction),
    (prop, propName) =>
      function(...args) {
        if (partial.length > 0 && right === false) {
          args = [...partial, ...args]
        }

        if (insertOptions && args.length === 0) {
          args.unshift(defaultOptions)
        }

        if (right === true && partial.length > 0) {
          args.push(...partial)
        }

        return prop.call(scope, ...args)
      }
  )

  defineProperty(interFace, 'isInterface', {
    enumerable: false,
    value: true,
    configurable: false,
  })

  return interFace
}

/**
 * @typedef {Object<String, Function>} Mixin
 *
 * @typedef {Object<String>} MixinOptions
 * @prop {Array} partial - an array of objects to be passed as arguments to the function
 * @prop {Boolean} right - whether to append the arguments
 * @prop {Boolean} insertOptions - whether to pass an empty object as the first arg automatically
 * @prop {Boolean} hidden - make the property non-enumerable
 * @prop {Boolean} configurable - make the property non-configurable
 */

/**
 * @param {Object} target - an object to extend
 * @param {Mixin} methods - an object of functions that will be applied to the target
 * @param {MixinOptions} options - options for the mixin attributes
 */
export function applyInterface(target, methods = {}, options = {}) {
  const {
    scope = target,
    transformKeys = true,
    safe = true,
    hidden = false,
    configurable = true,
  } = options

  const i = methods.isInterface
    ? methods
    : createInterface(methods, {
        scope,
        transformKeys,
        safe,
        hidden,
        ...options,
      })

  mapValues(i, (method, propName) => {
    if (transformKeys && propName.indexOf('get') === 0) {
      ;(hidden ? hideGetter : getter)(target, transformKey(propName), method.bind(scope))
    } else if (transformKeys && propName.indexOf('lazy') === 0) {
      lazy(target, transformKey(propName), method.bind(scope))
    } else if (propName === 'isInterface') {
      // do nothing
    } else {
      defineProperty(target, propName, {
        configurable: configurable,
        enumerable: !hidden,
        value: method.bind(scope),
      })
    }
  })

  return target
}

/**
 * Create a bunch of hidden or non-enumerable properties on an object.
 * Equivalent to calling Object.defineProperty with enumerable set to false.
 *
 * @param  {Object} target     The target object which will receive the properties
 * @param  {Object} properties =             {} a key/value pair of
 * @return {Object}            The target object
 */
export function hideProperties(target, properties = {}) {
  Object.keys(properties).forEach(propertyName => {
    hideGetter(target, propertyName, () => properties[propertyName])
  })

  return target
}

/**
 * Create a hidden getter property on the object.
 *
 * @param {Object} target  The target object to define the hidden getter
 * @param {String} name    The name of the property
 * @param {Function} fn      A function to call to return the desired value
 * @param {Object} [options={}] Additional options
 * @param {Object} [options.scope=target] The scope / binding for the function will be called in, defaults to target
 * @param {Array}  [options.args=[]] arguments that will be passed to the function
 * @param {Boolean} [options.configurable=true]
 * @param {Boolean} [options.writable=true]

 * @return {Object}          Returns the target object
 */
export function hideGetter(target, name, fn, options = {}) {
  if (typeof options === 'boolean') {
    options = { configurable: options }
  } else if (typeof options === 'object') {
    options = {
      configurable: true,
      scope: target,
      args: [],
      ...options,
    }
  } else {
    options = {}
  }

  if (typeof fn === 'function') {
    fn = partial(fn, ...(options.args || []))
  }

  defineProperty(target, name, {
    enumerable: false,
    ...options,
    get: function() {
      return typeof fn === 'function' && options.call !== false ? fn.call(options.scope) : fn
    },
  })

  return target
}

/**
 * creates a non enumerable property on the target object
 *
 * @name getter
 * @param {Object} target the target object
 * @param {String} name
 * @param {Function} fn which returns a value
 * @param {Object} [options={}]
 *
 */
export function getter(target, name, fn, options = {}) {
  return hideGetter(target, name, fn, {
    ...options,
    enumerable: true,
  })
}

/**
 * creates a non enumerable property on the target object
 *
 * @name hideProperty
 * @param {Object} target the target object
 * @param {String} attributeName
 * @param {*} value
 * @param {Object} definePropertyOptions
 *
 */
export function hideProperty(target, name, value, options = {}) {
  if (typeof options === 'boolean') {
    options = { configurable: options }
  } else if (typeof options === 'object') {
    options = {
      configurable: true,
      ...options,
    }
  } else {
    options = {}
  }

  defineProperty(target, name, {
    ...options,
    enumerable: false,
    value,
  })

  return target
}

/**
 * @alias hideProperty
 */
export const hide = hideProperty

/**
 * Creates a lazy loading property on an object.
 *
 * @name lazy
 * @param {Object} target The target object to receive the lazy loader
 * @param {String} attribute The property name
 * @param {Function} fn The function that will be memoized
 * @param {Boolean} enumerable Whether to make the property enumerable when it is loaded
 * @return {Object} Returns the target object
 */
export function lazy(target, attribute, fn, enumerable = false) {
  defineProperty(target, attribute, {
    configurable: true,
    enumerable,
    get: function() {
      delete target[attribute]

      if (enumerable) {
        let value = typeof fn === 'function' ? fn.call(target) : fn

        defineProperty(target, attribute, {
          enumerable: true,
          configurable: true,
          value,
        })

        return value
      } else {
        let value = typeof fn === 'function' ? fn.call(target) : fn

        defineProperty(target, attribute, {
          enumerable,
          configurable: true,
          value,
        })

        return value
      }
    },
  })

  return target
}
