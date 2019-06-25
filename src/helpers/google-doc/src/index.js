import runtime from '@skypager/runtime'
import * as GoogleIntegration from '@skypager/google'

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime, options = {}) {
  if (!runtime.features.checkKey('google')) {
    runtime.use(GoogleIntegration, options)
  }

  runtime.use(require('./GoogleDoc'))

  if (options.autoDiscover) {
    runtime.googleDocs.discover(options.discover || options).catch(error => error)
  }
}
