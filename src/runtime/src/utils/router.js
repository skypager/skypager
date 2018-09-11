import path from './path-to-regexp'
import { result, get, isArray } from 'lodash'

export function router(host, options = {}) {
  options = {
    hidden: false,
    pathsGetter: 'available',
    pathProperty: 'toString',
    routerProperty: 'router',
    host,
    matchesOnly: true,
    matcher: {},
    ...options,
  }

  const { hidden, pathsGetter, pathProperty, routerProperty, matcher } = options

  Object.defineProperty(host, routerProperty, {
    enumerable: !hidden,
    configurable: false,
    get: () => {
      return {
        filter: applyRoute,
        test: route,
        matcher: pathMatcher(matcher),
        get: (pattern, discard = options.matchesOnly) => {
          const pathsToTest = result(options.host, pathsGetter, []).map(item => {
            if (typeof item === 'string') {
              return item
            }

            return [result(item, pathProperty), item]
          })

          return applyRoute(pattern, pathsToTest, { discard })
        },
      }
    },
  })

  return get(host, options.routerProperty)
}

export default router

export function route(pattern, matcher = {}) {
  return pathMatcher(matcher)(pattern)
}

export function applyRoute(pattern = '*', pathsToTest = [], options = {}) {
  if (typeof pathsToTest === 'function') {
    pathsToTest = pathsToTest(options.matcher || {})
  }

  if (typeof pathsToTest === 'string') {
    pathsToTest = [pathsToTest]
  }

  const matcher = route(pattern)
  const matches = []
  const failures = []

  pathsToTest.forEach((path, index) => {
    let result
    let subject = path

    if (typeof path === 'string') {
      result = matcher(subject)
    }

    if (isArray(path) && typeof path[0] === 'string') {
      subject = path[0]
      result = matcher(subject)
    }

    if (!result) {
      failures.push([subject, index])
    } else {
      matches.push({
        result,
        index,
        subject,
        path,
        pattern,
      })
    }
  })

  if (options.discard) {
    return matches
  }

  return {
    failures,
    matches,
    pattern,
    pathsToTest,
  }
}

/*eslint-disable*/

export function pathMatcher(options = {}) {
  /**
     * String decoder
     * @param {String} str
     * @returns {*}
     */
  function decodeUri(str) {
    try {
      str = decodeURIComponent(str)
    } catch (e) {
      throw new Error("Cannot decodeURIComponent: " + str)
    }
    return str
  }

  return function(route) {
    var keys = [],
      reg = path.apply(this, [route, keys, options])

    return function(route, params) {
      var res = reg.exec(route),
        params = params || {}

      if (!res) return false

      for (var i = 1, l = res.length; i < l; i++) {
        if (res[i] === undefined) continue

        params[keys[i - 1].name] = decodeUri(res[i])
      }

      return params
    }
  }
}
