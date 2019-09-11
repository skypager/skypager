import * as scriptRunner from './script-runner.js'

export function attach(runtime) {
  runtime.features.register('script-runner', () => scriptRunner)
}
