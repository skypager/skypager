import runtime from '@skypager/runtime'
import * as SheetHelper from './GoogleSheet'
import * as GoogleIntegration from '@skypager/google'
import RowEntity from './RowEntity'

const { GoogleSheet } = SheetHelper

export { GoogleSheet, RowEntity }

export default GoogleSheet

if (runtime.isBrowser) {
  attach(runtime)
}

export function attach(runtime, options = {}) {
  if (!runtime.features.checkKey('google')) {
    runtime.use(GoogleIntegration, options)
  }

  runtime.use(SheetHelper, options)

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
