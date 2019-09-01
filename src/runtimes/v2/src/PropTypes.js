import propTypes from 'prop-types'
import checkPropTypes from 'check-prop-types'

const types = propTypes

export const runtimeType = types.shape({
  currentState: types.object,
  setState: types.func,
  replaceState: types.func,
  nextStateChange: types.func,
  feature: types.func,
  features: types.shape({
    lookup: types.func,
    register: types.func,
  }),
  enabledFeatureIds: types.arrayOf(types.string),
  state: types.shape({
    set: types.func,
    toJSON: types.func,
    get: types.func,
    observe: types.func,
  }).isRequired,
})

Object.assign(types, { runtime: runtimeType })

export { types }

export default types

export function check(subject, typeSpecs, options = {}) {
  const { componentName = '', location = '', getStack = () => '' } = options

  const result = checkPropTypes(typeSpecs, subject, location, componentName, getStack)

  return {
    pass: !result,
    ...(result && { result }),
  }
}
