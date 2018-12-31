let counter = 0

export function featureMethods() {
  return ['lazyFeatureMethod', 'getFeatureMethodGetter']
}

export function hostMethods() {
  return ['lazyHostMethod', 'getHostMethodGetter']
}

export function featureWasEnabled() {
  counter = 0
}

export function getFeatureMethodGetter(options = {}, context = {}) {
  return {
    options: Object.keys(options),
    context: Object.keys(context),
    id: this.id,
  }
}

export function lazyFeatureMethod(options = {}, context = {}) {
  return {
    options: Object.keys(options),
    context: Object.keys(context),
    id: this.id,
  }
}

export function getHostMethodGetter(options = {}, context = {}) {
  return {
    options: Object.keys(options),
    context: Object.keys(context),
    id: this.id,
  }
}

export function lazyHostMethod(options = {}, context = {}) {
  return {
    options: Object.keys(options),
    context: Object.keys(context),
    id: this.id,
    counter: counter = counter + 1,
  }
}
