import { hideProperty, hideGetter, lazy } from '../utils/properties'
import { partial, get } from 'lodash'

const { assign, getOwnPropertyDescriptors, keys } = Object
const descriptors = getOwnPropertyDescriptors

export function create(host, propKey, members = {}, cacheObject = {}) {
  const cacheKey = `_${propKey}`

  if (!host[cacheKey]) {
    hideProperty(host, cacheKey, cacheObject)
  }

  let getters = {}

  const available = keys(
    descriptors({
      ...host[cacheKey],
      ...members,
    })
  )

  available.forEach(key =>
    assign(getters, {
      get [key]() {
        return host[cacheKey][key]
      },
    })
  )

  hideGetter(host, propKey, () => {
    keys(descriptors(host[cacheKey])).forEach(key =>
      assign(getters, {
        get [key]() {
          return host[cacheKey][key]
        },
      })
    )

    return {
      ...getters,
      get available() {
        return keys(descriptors(host[cacheKey]))
      },
      get register() {
        return partial(lazy, host[cacheKey])
      },
      lookup(id) {
        return get(this, id) || get(getters, id)
      },
    }
  })

  return host[propKey]
}

export default create
