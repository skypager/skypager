import * as featureFinder from './feature-finder.js'

export function attach(runtime) {
  runtime.features.register('feature-finder', () => featureFinder)
}
