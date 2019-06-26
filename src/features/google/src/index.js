import * as GoogleFeature from './feature'

export function attach(runtime, options = {}) {
  if (!runtime.features.checkKey('google')) {
    runtime.features.register('google', () => GoogleFeature)
    runtime.feature('google').enable(options.google || options)
  }
}
