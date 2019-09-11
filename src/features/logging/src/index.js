import * as logging from './logging.js'

export function attach(runtime) {
  runtime.features.register('logging', () => logging)
}
