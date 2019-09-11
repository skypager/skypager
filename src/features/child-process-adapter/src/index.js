import * as childProcessAdapter from './child-process-adapter.js'

export function attach(runtime) {
  runtime.features.register('child-process-adapter', () => childProcessAdapter)
}
