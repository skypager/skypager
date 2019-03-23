import runtime from '@skypager/runtime'
import * as GoogleFeature from './feature'
import * as GoogleSheet from './GoogleSheet'

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime, options = {}) {
  if (!runtime.features.checkKey('google')) {
    runtime.features.register('google', () => GoogleFeature)
    runtime.feature('google').enable(options.google || options)
  }

  runtime.use(GoogleSheet)

  if (options.autoDiscover) {
    runtime.sheets.discover(options.discover || options).catch(error => error)
  }

  runtime.onRegistration('clients', () =>
    runtime.clients.register('sheets', () => require('./client'))
  )

  runtime.onRegistration('servers', () =>
    runtime.servers.register('sheets', () => require('./server'))
  )
}
