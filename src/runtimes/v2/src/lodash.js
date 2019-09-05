import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import get from 'lodash/get'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import result from 'lodash/result'
import partial from 'lodash/partial'
import partialRight from 'lodash/partialRight'

export const lodash = {}

if (typeof global._ !== 'undefined') {
  Object.assign(lodash, global._)  
}

if (typeof global.lodash !== 'undefined') {
  Object.assign(lodash, global.lodash)  
}

export { omit, pick, get, result, partial, partialRight, isObject, isFunction }

export default Object.assign(lodash, { omit, pick, get, result, partial, partialRight, isObject, isFunction })
