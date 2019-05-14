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

  require(request) {
    const { isError, attempt, isFunction } = this.lodash
    console.log(`BUNDLE Requiring ${request}`, isFunction(webpackRequire))

    let response

    if (this.modules.has(request)) {
      const registeredValue = this.modules.get(request)
      console.log('BUNDLE PRE-REGISTERED', request, registeredValue, typeof registeredValue)

      if (typeof registeredValue === 'number') {
        request = registeredValue
      } else if (typeof registeredValue !== 'string') {
        return registeredValue
      }
    }

    if (isFunction(webpackRequire)) {
      console.log('Webpack Require', webpackRequire)
      response = attempt(() => webpackRequire(request))

      if (isError(response)) {
        console.log('BUNDLE REQUIRE FAILED', response)
        response = undefined
      }
    }

    console.log('BUNDLE RESPONSE', response)
    return response
  }
}
