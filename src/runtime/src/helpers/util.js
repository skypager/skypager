import lodash from 'lodash'
import { enhanceObject } from '../utils/properties'

const {
  flatten,
  castArray,
  isUndefined,
  partialRight,
  mapValues,
  pickBy,
  isFunction,
  defaults,
} = lodash

export function createHost(target = {}, options = {}, context = {}) {
  enhanceObject(target, lodash)

  target.hide('options', options)
  target.hide('argv', context.argv || {})
  target.hide('sandbox', context)

  target.hide('getOption', getOption.bind(target))
  target.hide('resultOption', resultOption.bind(target))
  target.hide('tryGet', tryGet.bind(target))
  target.hide('tryResult', tryResult.bind(target))

  target.hide('createSandbox', (ctx = {}) => ({
    project: target,
    host: target,
    ...context,
    ...ctx,
  }))

  return target
}

export function resultOption(key, val) {
  key = typeof key === 'string' ? key.split('.') : key
  key = flatten(castArray(key))

  return this.result(['options', ...key], val)
}

export function getOption(key, val) {
  key = typeof key === 'string' ? key.split('.') : key
  key = flatten(castArray(key))

  return this.get(['options', ...key], val)
}

export function createMixin(methods = {}, target, ...partialArgs) {
  const functions = pickBy(methods, isFunction)
  const partialed = mapValues(functions, fn => partialRight(fn.bind(target), ...partialArgs))

  return mapValues(partialed, boundFn => (options = {}, ...args) => boundFn(options, ...args))
}

/**
 * Access the first value we find in our options hash in our provider hash
 */
export function tryGet(property, defaultValue, sources = ['options', 'provider']) {
  return this.at(...sources.map(s => `${s}.${property}`)).find(v => !isUndefined(v)) || defaultValue
}

/**
 * Access the first value we find in our options hash in our provider hash
 *
 * If the method is a function, it will be called in the scope of the helper,
 * with the helpers options and context
 */
export function tryResult(property, defaultValue, options = {}, context = {}) {
  const val = this.tryGet(property)

  if (!val) {
    return typeof defaultValue === 'function'
      ? defaultValue.call(
          this,
          {
            ...this.options,
            ...options,
          },
          {
            ...this.context,
            ...context,
          }
        )
      : defaultValue
  } else if (typeof val === 'function') {
    return val.call(
      this,
      {
        ...this.options,
        ...options,
      },
      {
        ...this.context,
        ...context,
      }
    )
  } else {
    return val
  }
}

// Merge the objects found at k starting with at options, provider,
// projectConfig
export function mergeGet(key) {
  key = typeof key === 'string' ? key.split('.') : key

  return defaults(
    {},
    this.get(['options', ...key]),
    this.get(['provider', ...key]),
    this.get(['projectConfig', ...key])
  )
}

// Merge the objects found at k starting with at options, provider,
// projectConfig If the property is a function, it will be called in the scope
// of the helper, with the helpers options and context
export function mergeResult(key) {
  key = typeof key === 'string' ? key.split('.') : key

  const values = [
    this.get(['options', ...key]),
    this.get(['provider', ...key]),
    this.get(['projectConfig', ...key]),
  ].map(v => (typeof v === 'function' ? v.call(this, this.options, this.context) : v))

  return defaults({}, ...values)
}
