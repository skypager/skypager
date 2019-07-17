import * as networking from './networking.js'

export function attach(runtime) {
  runtime.features.register('networking', () => networking)
}
