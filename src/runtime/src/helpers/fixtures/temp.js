export const hostMethods = ['functionProvidedByFeature']

export function functionProvidedByFeature(options = {}, context = {}) {}

export const featureMethods = ['myFunction']

export function myFunction(options = {}, context = {}) {}

export function configFeatures() {
  return {
    nice(existing = [], arg) {
      if (!arguments.length) {
        return
      }

      return [...existing, arg]
    },
  }
}

export function configReducers() {
  return {
    boom(state) {
      return state.nice
    },
  }
}
