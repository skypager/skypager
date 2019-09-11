import * as opener from './opener.js'

export function attach(runtime) {
  runtime.features.register('opener', () => opener)
}
