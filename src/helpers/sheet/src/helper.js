import * as google from 'googleapis'

export function attach(runtime) {
  const { Helper } = runtime

  class Sheet extends Helper {
    static isCacheable = true
    static allowAnonymousProviders = true
    static strictMode = false
    static google = google

    get google() {
      return google
    }

    static attach(host, options = {}) {
      return Helper.attach(host, Sheet, {
        registry: Helper.createContextRegistry('sheets', {
          context: Helper.createMockContext(),
        }),
        lookupProp: 'sheet',
        registryProp: 'sheets',
        ...options,
      })
    }
  }

  try {
    Helper.registerHelper('sheet', () => Sheet)
    Sheet.attach(runtime)
  } catch (error) {
    runtime.setState({ sheetHelpersError: error })
    throw error
  }

  return runtime
}
