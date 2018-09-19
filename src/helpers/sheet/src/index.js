import runtime from '@skypager/runtime'
import * as GoogleFeature from './feature'

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime) {
  runtime.use(require('./helper'))

  if (!runtime.features.checkKey('google')) {
    runtime.features.register('google', () => GoogleFeature)
  }
}
