import { Feature } from '@skypager/runtime'

let webpackRequire
let webpackModules
let webpackResolve

export default class Bundle extends Feature {
  static shortcut = 'bundle'
  static isObservable = true

  static observables() {
    return {
      modules: ['shallowMap', []],
    }
  }

  get webpackModules() {
    return webpackModules
  }

  get webpackResolve() {
    return webpackResolve
  }

  get webpackRequire() {
    return webpackRequire
  }

  register(resolveMap) {
    this.modules.merge(resolveMap)
  }

  loadWebpack({ requireFn, cache, resolveFn } = {}) {
    console.log('bundle loading webpack', { requireFn, cache, resolveFn })
    if (typeof requireFn === 'function') {
      webpackRequire = requireFn
    }

    if (typeof resolveFn === 'function') {
      webpackResolve = resolveFn
    }

    webpackModules = cache
  }

  resolve(request) {
    const { isError, attempt, isFunction } = this.lodash
    let response

    if (isFunction(webpackResolve)) {
      response = attempt(() => webpackResolve(request))

      if (isError(response)) {
        response = undefined
      }
    }

    return response
  }

  requireModule(request) {
    const { isError, attempt, isFunction } = this.lodash
    console.log(`BUNDLE Requiring ${request}`)

    let response

    if (this.modules.has(request)) {
      const registeredValue = this.modules.get(request)
      console.log('BUNDLE PRE-REGISTERED', request, registeredValue, typeof registeredValue)

      if (typeof registeredValue === 'number') {
        request = registeredValue
      } else if (typeof registeredValue === 'string') {
        const aliased = this.modules.get(registeredValue)

        console.log(this.modules.toJSON())
        console.log('BUNDLE CHECKING ALIAS', aliased, registeredValue)
        if (this.modules.has(aliased)) {
          console.log('BUNDLE ALIAS FOUND', aliased, registeredValue)
          request = aliased
        } else {
          request = registeredValue
        }
      } else if (registeredValue) {
        response = registeredValue
      }
    } else {
      console.log('BUNDLE DOESNT HAVE', request)
    }

    if (isFunction(webpackRequire) && typeof request === 'string') {
      console.log('WEBPACK REQUIRING', request)
      response = attempt(() => webpackRequire(request))

      if (isError(response)) {
        console.log('BUNDLE REQUIRE FAILED', request, response)
        response = undefined
      }
    } else if (!isFunction(webpackRequire)) {
      console.log('BUNDLE HAS NO WEBPACK REQUIRE')
    }

    console.log('BUNDLE RESPONSE', response)
    return response
  }
}
