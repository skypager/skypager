import * as skywalker from './skywalker.js'

export function attach(runtime) {
  runtime.features.register('skywalker', () => skywalker)
}
