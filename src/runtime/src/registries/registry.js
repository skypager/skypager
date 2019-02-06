import { hideProperty, hideGetter, lazy } from '../utils/properties'
import { partial, get } from 'lodash'

const { assign, getOwnPropertyDescriptors, keys } = Object
const descriptors = getOwnPropertyDescriptors

export function create(host, propKey, members = {}, cacheObject = {}) {
  const cacheKey = `_${propKey}`

  if (!host[cacheKey]) {
    hideProperty(host, cacheKey, new Map())
  }

  const registryMap = host[cacheKey]

  Object.entries(members).forEach(([key, value]) => {
    registryMap.set(key, value)
  })

  Object.entries(cacheObject).forEach(([key, value]) => {
    registryMap.set(key, value)
  })

  const resolved = new Map()

  const registry = {
    get(key) {
      return registryMap.get(key)
    },
    has(key) {
      return registryMap.has(key)
    },
    remove(key) {
      registryMap.delete(key)
      return registryMap
    },
    get available() {
      return Array.from(registryMap.keys())
    },
    lookup(id) {
      let val = registryMap.get(id)

      if (resolved.has(id)) {
        const found = registryMap.get(id)
        return found
      }

      if (typeof val === 'function' && !resolved.has(id)) {
        const newVal = val()
        resolved.set(id, true)
        registryMap.set(id, newVal)
        val = newVal
      }

      return val
    },
    register(id, value) {
      resolved.delete(id)
      registryMap.set(id, value)
      return value
    },
  }

  hideGetter(host, propKey, () => registry)

  return registry
}

export default create
