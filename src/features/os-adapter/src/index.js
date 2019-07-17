import * as osAdapter from './os-adapter.js'

export function attach(runtime) {
  runtime.features.register('os-adapter', () => osAdapter)
}
