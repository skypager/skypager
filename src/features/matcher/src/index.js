import * as matcher from './matcher.js'

export function attach(runtime) {
  runtime.features.register('matcher', () => matcher)
}
