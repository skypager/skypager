import * as moduleFactory from './module-factory.js'

export function attach(runtime) {
  runtime.features.register('module-factory', () => moduleFactory)
}
