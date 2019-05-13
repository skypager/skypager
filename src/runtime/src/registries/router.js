import path from '../utils/path-to-regexp'
import { result, get } from 'lodash'

export function router(host, options = {}) {
  options = {
    pathsGetter: 'available',
    pathProperty: 'toString',
    routerProperty: 'router',
    matcher: {},
    ...options,
  }

  const { pathsGetter, pathProperty, routerProperty, matcher } = options

  Object.defineProperty(host, routerProperty, {
    enumerable: false,
    configurable: false,
    get: () => {
      return {
        filter: applyRoute,
        test: route,
        matcher: pathMatcher(matcher),
        get: (pattern, discard = true) => {
          const pathsToTest = result(host, pathsGetter, []).map(item => result(item, pathProperty))

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
    const matchResult = matcher(path)

    if (matchResult === false) {
      failures.push([path, index])
    } else {
      matches.push({ result: matchResult, index, path, pattern })
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
      throw new Error('Cannot decodeURIComponent: ' + str)
    }
    return str
  }

  return function(route) {
    var keys = [],
      reg = path.call(this, [route, keys, options])

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
