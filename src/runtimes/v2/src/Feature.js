import Helper from './Helper'

export class Feature extends Helper {
  static isCacheable = true

  static registryName = 'features'

  static factoryName = 'feature'

  static get isFeature() {
    return true
  }

  enable() {}
}

export function attach(host, options = {}) {
  return Feature.attach(host, options)
}

export default Feature
