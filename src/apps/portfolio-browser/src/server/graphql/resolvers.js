import { set } from 'lodash'
import JSON from 'graphql-type-json'

const resolvers = {
  JSON,
}

export function resolve(path, resolver) {
  set(resolvers, path, resolver)

  return (...args) => resolve(...args)
}

resolve.value = () => {
  return resolvers
}
