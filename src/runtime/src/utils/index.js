export { hideProperty, hideGetter, hideProperties, lazy, propertyUtils, mixinPropertyUtils, hide } from "./properties"

export { query } from "./query"
export { create as registry } from "./registry"

export * as strings from "./string"

export testRule from "./path-matcher"

export { router, route, applyRoute, pathMatcher } from "./router"

/**
 * Treats all values of an object as Promises and resolves them.

 * @param  {Object} obj The object which has the promises to be resolved
 * @return {Promise}    A Promise which will resolve with the object values
 */
export function promiseHash(obj) {
  var awaitables = []

  var keys = Object.keys(obj)

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var a$ = obj[key]
    awaitables.push(a$)
  }

  return Promise.all(awaitables).then(function(results = {}) {
    var byName = {}
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      byName[key] = results[i]
    }
    return byName
  })
}

export const DOMAIN_REGEX = /^[a-zA-Z0-9_-]+\.[.a-zA-Z0-9_-]+$/

export function isDomain(value) {
  return value.match(DOMAIN_REGEX)
}

export function isPromise(obj) {
  return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function"
}

export function isArray(arg) {
  return Object.prototype.toString.call(arg) === "[object Array]"
}

export function isRegex(val) {
  if (
    (typeof val === "undefined" ? "undefined" : typeof val) === "object" &&
    Object.getPrototypeOf(val).toString() === "/(?:)/"
  ) {
    return true
  }

  return false
}
