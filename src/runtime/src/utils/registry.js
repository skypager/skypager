const { defineProperty, assign, getOwnPropertyDescriptors, keys } = Object
const descriptors = getOwnPropertyDescriptors

/**
 * Takes a host object and attaches a registry object to it. The registry object is
 * an interface that allows you to query for information about its member functions
 * member functions are any function that you want to register by name. they will be memoized
 * lazy loading functions that can be called in the future.
 *
 */
export function create(host = {}, propKey = 'registry', members = {}) {
  if (!host) {
    throw 'You must pass a host object'
  }

  const cacheKey = `_${propKey}`

  if (!host[cacheKey]) {
    defineProperty(host, cacheKey, { enumerable: false, value: {} })
  }

  let getters = {}

  const available = keys(
    descriptors({
      ...host[cacheKey],
      ...members,
    })
  )

  available.forEach(key =>
    assign(getters, {
      get [key]() {
        return host[cacheKey][key]
      },
    })
  )

  hideGetter(host, propKey, () => {
    keys(descriptors(host[cacheKey])).forEach(key =>
      assign(getters, {
        get [key]() {
          return host[cacheKey][key]
        },
      })
    )

    return {
      ...getters,
      get available() {
        return keys(descriptors(host[cacheKey]))
      },
      get register() {
        return (id, fn) => lazy(host[cacheKey], id, fn)
      },
    }
  })

  return host[propKey]
}

export default create

function lazy(target, attribute, fn, enumerable = false) {
  defineProperty(target, attribute, {
    configurable: true,
    enumerable,
    get: function() {
      delete target[attribute]

      if (enumerable) {
        return (target[attribute] = typeof fn === 'function' ? fn.call(target) : fn)
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

function hideGetter(target, prop, fn) {
  Object.defineProperty(target, prop, {
    get: fn.bind(target),
    enumerable: false,
    configurable: true,
  })
}
