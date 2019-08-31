import Runtime from './Runtime'
import Helper from './Helper'
import Registry from './Registry'
import Entity from './Entity'
import Feature from './Feature'
import types, { check as checkTypes } from './PropTypes'

export { Helper, Registry, Entity, Runtime, Feature, types, checkTypes }

export function isValidHelper(HelperClass) {
  return typeof HelperClass === 'function' && HelperClass.constructor && HelperClass.isHelper
}

export function createHelper(HelperClass, options = {}, context = {}) {
  return HelperClass.create(options, {
    ...singleton.context,
    ...context,
  })
}

/**
 * The instance of the runtime you get when you import skypager/runtime is always
 * going to be the same object.  This allows you to construct the full runtime dependency
 * chain in an asynchronous, layered approach.  The runtime object can be extended indefinitely
 * before being started, at which point it can begin dynamically loading additional dependencies.
 *
 */

const singleton = new Runtime()

export default singleton
