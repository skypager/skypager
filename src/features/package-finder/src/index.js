import * as packageFinder from './package-finder.js'

export function attach(runtime) {
  runtime.features.register('package-finder', () => packageFinder)
}
