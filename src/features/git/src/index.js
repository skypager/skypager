import * as git from './git.js'

export function attach(runtime) {
  runtime.features.register('git', () => git)
}
