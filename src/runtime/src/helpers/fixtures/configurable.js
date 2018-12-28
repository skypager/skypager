let counter = 0

export const configPresets = {
  auto(builder) {
    return builder.service('autoService', { auto: true }).sheet('autoSheet', { auto: true })
  },
}

export const configFeatures = {
  service(existing = {}, providerName, providerOptions = {}) {
    if (!arguments.length) {
      return
    }

    if (providerName && providerOptions) {
      return {
        ...existing,
        [providerName]: {
          ...(existing[providerName] || {}),
          ...providerOptions,
        },
      }
    } else {
      return existing
    }
  },
  sheet(existing = [], sheetName, config = {}) {
    if (!arguments.length) {
      return
    }

    existing = existing.map ? existing : []

    if (sheetName && config) {
      return [...existing, ...[{ ...config, sheetName }]]
    }

    return existing
  },
}

export const configReducers = {
  service({ service, sheet } = {}) {
    return service ? service : {}
  },
  sheet({ sheet } = {}) {
    return sheet ? sheet : {}
  },
}

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
