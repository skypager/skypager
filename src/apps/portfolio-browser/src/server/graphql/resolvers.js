import { set } from 'lodash'

const resolvers = {}

export function resolve(path, resolver) {
  set(resolvers, path, resolver)

  return (...args) => resolve(...args)
}

resolve.value = () => {
  return resolvers
}
