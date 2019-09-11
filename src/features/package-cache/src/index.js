import * as packageCache from './package-cache.js'

export function attach(runtime) {
  runtime.features.register('package-cache', () => packageCache)
}
