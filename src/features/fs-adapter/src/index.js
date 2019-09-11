import * as fsAdapter from './fs-adapter.js'

export function attach(runtime) {
  runtime.features.register('fs-adapter', () => fsAdapter)
}
