import {
  pickBy,
  mapValues,
  partial,
  isFunction,
  isArray,
  isObject,
  has,
  camelCase,
  cloneDeep,
  lowerFirst,
  omit,
} from 'lodash'

const { defineProperty } = Object

global.DEBUG_LODASH_USAGE = global.DEBUG_LODASH_USAGE || process.env.DEBUG_LODASH_USAGE

/**
 * Creates some functions that are useful when trying to decorate objects with hidden properties or getters,
 * or lazy loading properties, etc.  I use this a lot inside of constructor functions for singleton type objects.
 *
 * @param  {Object} target This is the object you intend to be decorating
 * @return {Object}        Returns an object with some wrapper functions around Object.defineProperty
 */
export function propertyUtils(target) {
  return {
    lazy: partial(lazy, target),
    hide: partial(hideProperty, target),
    hideProperty: partial(hideProperty, target),
    hideGetter: partial(hideGetter, target),
    hideProperties: partial(hideProperties, target),
    getter: partial(getter, target),
    applyInterface: partial(applyInterface, target),
  }
}

export function createCollection(host = {}, items = []) {
  mixinPropertyUtils(host, true, false)

  host.lazy('models', function() {
    return mixinPropertyUtils((isFunction(items) ? items.call(host) : items) || [], true)
  })

  return host
}

export function mixinPropertyUtils(target, includeLodashMethods = true, includeChain = false) {
  return enhanceObject(target, { includeLodashMethods, includeChain }, global.lodash)
}

export function enhanceObject(target, options, lodash = global.lodash) {
  const propUtils = propertyUtils(target)

  mapValues(propUtils, (fn, name) => {
    hideProperty(target, name, fn)
  })

  if (typeof options === 'function' && options.VERSION) {
    lodash = options
    options = {}
  }

  const {
    includeLodashMethods = isFunction(lodash),
    includeChain = isFunction(lodash) && isFunction(lodash.chain),
  } = options

  if (global.DEBUG_LODASH_USAGE) {
    console.log({
      includeLodashMethods,
      includeChain,
      target: target.constructor && target.constructor.name,
    })
  }

  if (includeLodashMethods) {
    if (isObject(target) && !isArray(target)) {
      objectMethods
        .filter(name => lodash[name])
        .forEach(name => {
          const fn = partial(lodash[name], target)
          hideProperty(target, name, (...args) => {
            global.DEBUG_LODASH_USAGE &&
              console.log(
                `LODASH ACCESS: ${name}`,
                target.constructor ? target.constructor.name : target.uuid || target
              )
            return fn(...args)
          })
        })
    } else if (isArray(target)) {
      collectionMethods
        .filter(name => lodash[name])
        .forEach(name => {
          const fn = partial(lodash[name], target)
          hideProperty(target, name, (...args) => {
            global.DEBUG_LODASH_USAGE &&
              console.log(
                `LODASH ACCESS: ${name}`,
                target.constructor ? target.constructor.name : target.uuid || target
              )
            return fn(...args)
          })
        })
      arrayMethods
        .filter(name => lodash[name])
        .forEach(name => {
          const fn = partial(lodash[name], target)
          hideProperty(target, name, (...args) => {
            global.DEBUG_LODASH_USAGE &&
              console.log(
                `LODASH ACCESS: ${name}`,
                target.constructor ? target.constructor.name : target.uuid || target
              )
            return fn(...args)
          })
        })
    }
  }

  if (includeChain && !has(target, 'chain') && isFunction(lodash.chain)) {
    const fn = partial(lodash.chain, target)
    hideGetter(target, 'chain', () => {
      global.DEBUG_LODASH_USAGE &&
        console.log(
          `LODASH ACCESS CHAIN`,
          target.constructor ? target.constructor.name : target.uuid || target
        )
      return fn()
    })
  }

  return target
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

export function applyInterface(target, methods = {}, options = {}) {
  const {
    scope = target,
    transformKeys = true,
    safe = true,
    hidden = false,
    configurable = false,
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

export function mixinLodashMethods(target) {
  const l = lodashModules().lodashObject
  Object.keys(l).forEach(method => hideProperty(target, method, partial(l[method], target)))
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
 * @param  {Object}   target  The target object to define the hidden getter
 * @param  {String}   name    The name of the property
 * @param  {Function} fn      A function to call to return the desired value
 * @param  {Object}   options =             {} Additional options
 * @param  {Object}   options.scope The scope / binding for the function will be called in, defaults to target
 * @param  {Array}    options.args arguments that will be passed to the function

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

// Creates a getter but makes it enumerable
export function getter(target, name, fn, options = {}) {
  return hideGetter(target, name, fn, {
    ...options,
    enumerable: true,
  })
}

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

export const hide = hideProperty

/**
 * Creates a lazy loading property on an object.

 * @param  {Object}   target     The target object to receive the lazy loader
 * @param  {String}   attribute  The property name
 * @param  {Function} fn         The function that will be memoized
 * @param  {[type]}   enumerable =             false Whether to make the property enumerable when it is loaded
 * @return {Object}              Returns the target object
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

export const createEntity = (object = {}, ...args) => {
  return mixinPropertyUtils(cloneDeep(object), ...args)
}

export const hashObject = require('./object-hash')

const objectMethods = [
  'assign',
  'assignIn',
  'assignInWith',
  'assignWith',
  'at',
  'create',
  'defaults',
  'defaultsDeep',
  'entries',
  'entriesIn',
  'extend',
  'extendWith',
  'findKey',
  'findLastKey',
  'forIn',
  'forInRight',
  'forOwn',
  'forOwnRight',
  'functions',
  'functionsIn',
  'get',
  'has',
  'hasIn',
  'invert',
  'invertBy',
  'invoke',
  'keys',
  'keysIn',
  'mapKeys',
  'mapValues',
  'merge',
  'mergeWith',
  'omit',
  'omitBy',
  'pick',
  'pickBy',
  'result',
  'set',
  'setWith',
  'toPairs',
  'toPairsIn',
  'transform',
  'unset',
  'update',
  'updateWith',
  'values',
  'valuesIn',
]

const arrayMethods = [
  'chunk',
  'compact',
  'concat',
  'difference',
  'differenceBy',
  'differenceWith',
  'drop',
  'dropRight',
  'dropRightWhile',
  'dropWhile',
  'fill',
  'findIndex',
  'findLastIndex',
  'first',
  'flatten',
  'flattenDeep',
  'flattenDepth',
  'fromPairs',
  'head',
  'indexOf',
  'initial',
  'intersection',
  'intersectionBy',
  'intersectionWith',
  'join',
  'last',
  'lastIndexOf',
  'nth',
  'pull',
  'pullAll',
  'pullAllBy',
  'pullAllWith',
  'pullAt',
  'remove',
  'reverse',
  'slice',
  'sortedIndex',
  'sortedIndexBy',
  'sortedIndexOf',
  'sortedLastIndex',
  'sortedLastIndexBy',
  'sortedLastIndexOf',
  'sortedUniq',
  'sortedUniqBy',
  'tail',
  'take',
  'takeRight',
  'takeRightWhile',
  'takeWhile',
  'union',
  'unionBy',
  'unionWith',
  'uniq',
  'uniqBy',
  'uniqWith',
  'unzip',
  'unzipWith',
  'without',
  'xor',
  'xorBy',
  'xorWith',
  'zip',
  'zipObject',
  'zipObjectDeep',
  'zipWith',
]

const collectionMethods = [
  'countBy',
  'each',
  'eachRight',
  'every',
  'filter',
  'find',
  'findLast',
  'flatMap',
  'flatMapDeep',
  'flatMapDepth',
  'forEach',
  'forEachRight',
  'groupBy',
  'includes',
  'invokeMap',
  'keyBy',
  'map',
  'orderBy',
  'partition',
  'reduce',
  'reduceRight',
  'reject',
  'sample',
  'sampleSize',
  'shuffle',
  'size',
  'some',
  'sortBy',
]
