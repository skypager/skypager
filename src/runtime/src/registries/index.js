import { omit, startCase } from 'lodash'
import _Simple from './simple'
import _Directory from './directory'
import _Context from './context'
import _Base from './registry'

export const Simple = _Simple
export const Directory = _Directory
export const Context = _Context
export const Base = _Base

export const Registries = {
  Base,
  Directory,
  Context,
  Simple,
}

export function create(options = {}) {
  options = {
    name: 'registry',
    type: 'Simple',
    ...options,
  }

  const Registry = Registries[startCase(options.type)] || Simple

  return new Registry(options.name, omit(options, 'name', 'type'))
}

export default {
  ...Registries,
  create,
}
