import isObject from 'lodash-es/isObject'
import isFunction from 'lodash-es/isFunction'
import get from 'lodash-es/get'
import omit from 'lodash-es/omit'
import pick from 'lodash-es/pick'
import result from 'lodash-es/result'
import partial from 'lodash-es/partial'
import partialRight from 'lodash-es/partialRight'

const lodash =
  typeof global._ === 'undefined' || typeof global.lodash === 'undefined'
    ? global._ || global.lodash
    : {}

lodash.isObject = lodash.isObject || isObject
lodash.isFunction = lodash.isFunction || isFunction
lodash.get = lodash.get || get
lodash.pick = lodash.pick || pick
lodash.omit = lodash.omit || omit
lodash.result = lodash.result || result
lodash.partial = lodash.partial || partial
lodash.partialRight = lodash.partialRight || partialRight

export { omit, pick, get, result, partial, partialRight, isObject, isFunction }

export default lodash
