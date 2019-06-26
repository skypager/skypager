import runtime from '@skypager/runtime'
import * as GoogleIntegration from '@skypager/google'
import * as GoogleHelper from './GoogleDoc'

const { GoogleDoc } = GoogleHelper

export { GoogleDoc }

export default GoogleDoc

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime, options = {}) {
  if (!runtime.features.checkKey('google')) {
    runtime.use(GoogleIntegration, options)
  }

  runtime.use(GoogleHelper, options)

  if (options.autoDiscover) {
    runtime.googleDocs.discover(options.discover || options).catch(error => error)
  }
}
