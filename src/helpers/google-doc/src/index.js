import runtime from '@skypager/runtime'
import * as GoogleFeature from './feature'

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime, options = {}) {
  if (!runtime.features.checkKey('google')) {
    runtime.features.register('google', () => GoogleFeature)
    runtime.feature('google').enable(options.google || options)
  }

  runtime.use(require('./GoogleDoc'))

  if (options.autoDiscover) {
    runtime.googleDocs.discover(options.discover || options).catch(error => error)
  }
}
