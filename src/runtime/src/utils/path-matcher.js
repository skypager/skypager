import { every, isRegExp, isUndefined, isFunction, isArray, isString } from 'lodash'

export const pathMatcher = (rule, subject) => {
  if (isUndefined(rule) || isUndefined(subject)) {
    throw new Error(`Expects a rule to test and a subject to test against`)
  }

  if (isString(rule) && !isString(subject)) {
    rule = arguments[1]
    subject = arguments[0]
  }

  if (isRegExp(rule)) {
    return rule.test(subject)
  } else if (isFunction(rule)) {
    return !!rule(subject)
  } else if (isArray(rule)) {
    return every(rule, condition => pathMatcher(condition, subject))
  } else if (isString(rule)) {
    return new RegExp(rule).test(subject)
  } else {
    throw new Error('Invalid include / exclude rule')
  }
}

export default pathMatcher
