import * as mainScript from './main-script.js'

export function attach(runtime) {
  runtime.features.register('main-script', () => mainScript)
}
