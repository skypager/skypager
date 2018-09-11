import { capitalize } from 'lodash'
/**
 * @copyright https://github.com/sonnym/inflect-js/
 */
const uncountableRules = [
  'equipment',
  'information',
  'rice',
  'money',
  'species',
  'series',
  'fish',
  'sheep',
  'moose',
  'deer',
  'news',
]
// These rules translate from the singular form of a noun to its plural form.
const pluralRules = [
  [new RegExp('(m)an$', 'gi'), '$1en'],
  [new RegExp('(pe)rson$', 'gi'), '$1ople'],
  [new RegExp('(child)$', 'gi'), '$1ren'],
  [new RegExp('^(ox)$', 'gi'), '$1en'],
  [new RegExp('(ax|test)is$', 'gi'), '$1es'],
  [new RegExp('(octop|vir)us$', 'gi'), '$1i'],
  [new RegExp('(alias|status)$', 'gi'), '$1es'],
  [new RegExp('(bu)s$', 'gi'), '$1ses'],
  [new RegExp('(buffal|tomat|potat)o$', 'gi'), '$1oes'],
  [new RegExp('([ti])um$', 'gi'), '$1a'],
  [new RegExp('sis$', 'gi'), 'ses'],
  [new RegExp('(?:([^f])fe|([lr])f)$', 'gi'), '$1$2ves'],
  [new RegExp('(hive)$', 'gi'), '$1s'],
  [new RegExp('([^aeiouy]|qu)y$', 'gi'), '$1ies'],
  [new RegExp('(x|ch|ss|sh)$', 'gi'), '$1es'],
  [new RegExp('(matr|vert|ind)ix|ex$', 'gi'), '$1ices'],
  [new RegExp('([m|l])ouse$', 'gi'), '$1ice'],
  [new RegExp('(quiz)$', 'gi'), '$1zes'],
  [new RegExp('s$', 'gi'), 's'],
  [new RegExp('$', 'gi'), 's'],
]
// These rules translate from the plural form of a noun to its singular form.
const singularRules = [
  [new RegExp('(m)en$', 'gi'), '$1an'],
  [new RegExp('(pe)ople$', 'gi'), '$1rson'],
  [new RegExp('(child)ren$', 'gi'), '$1'],
  [new RegExp('([ti])a$', 'gi'), '$1um'],
  [new RegExp('((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$', 'gi'), '$1$2sis'],
  [new RegExp('(hive)s$', 'gi'), '$1'],
  [new RegExp('(tive)s$', 'gi'), '$1'],
  [new RegExp('(curve)s$', 'gi'), '$1'],
  [new RegExp('([lr])ves$', 'gi'), '$1f'],
  [new RegExp('([^fo])ves$', 'gi'), '$1fe'],
  [new RegExp('([^aeiouy]|qu)ies$', 'gi'), '$1y'],
  [new RegExp('(s)eries$', 'gi'), '$1eries'],
  [new RegExp('(m)ovies$', 'gi'), '$1ovie'],
  [new RegExp('(x|ch|ss|sh)es$', 'gi'), '$1'],
  [new RegExp('([m|l])ice$', 'gi'), '$1ouse'],
  [new RegExp('(bus)es$', 'gi'), '$1'],
  [new RegExp('(o)es$', 'gi'), '$1'],
  [new RegExp('(shoe)s$', 'gi'), '$1'],
  [new RegExp('(cris|ax|test)es$', 'gi'), '$1is'],
  [new RegExp('(octop|vir)i$', 'gi'), '$1us'],
  [new RegExp('(alias|status)es$', 'gi'), '$1'],
  [new RegExp('^(ox)en', 'gi'), '$1'],
  [new RegExp('(vert|ind)ices$', 'gi'), '$1ex'],
  [new RegExp('(matr)ices$', 'gi'), '$1ix'],
  [new RegExp('(quiz)zes$', 'gi'), '$1'],
  [new RegExp('s$', 'gi'), ''],
]
// This is a list of words that should not be capitalized for title case
const non_titlecased_words = [
  'and',
  'or',
  'nor',
  'a',
  'an',
  'the',
  'so',
  'but',
  'to',
  'of',
  'at',
  'by',
  'from',
  'into',
  'on',
  'onto',
  'off',
  'out',
  'in',
  'over',
  'with',
  'for',
]
// These are regular expressions used for converting between String formats
const idSuffix = new RegExp('(_ids|_id)$', 'g')
const underbar = new RegExp('_', 'g')
const spaceOrUnderbar = new RegExp('[ _]', 'g')
const uppercase = new RegExp('([A-Z])', 'g')
const underbarPrefix = new RegExp('^_')

/*
This is a helper method that applies rules based replacement to a String
  Signature:
    applyRules(str, rules, skip, override) == String
  Arguments:
    str - String - String to modify and return based on the passed rules
    rules - Array: [RegExp, String] - Regexp to match paired with String to use for replacement
    skip - Array: [String] - Strings to skip if they match
    override - String (optional) - String to return as though this method succeeded (used to conform to APIs)
  Returns:
    String - passed String modified by passed rules
  Examples:
    applyRules("cows", InflectionJs.singularRules) === 'cow'
*/
function applyRules(str, rules, skip, override) {
  if (override) {
    str = override
  } else {
    var ignore = skip.indexOf(str.toLowerCase()) > -1
    if (!ignore) {
      for (var x = 0; x < rules.length; x++) {
        if (str.match(rules[x][0])) {
          str = str.replace(rules[x][0], rules[x][1])
          break
        }
      }
    }
  }
  return str
}

export function pluralize(string, plural) {
  return applyRules(string, pluralRules, uncountableRules)
}

export function singularize(string, singular) {
  return applyRules(string, singularRules, uncountableRules, singular)
}

export function humanize(string, lowFirstLetter) {
  var str = string.toLowerCase()
  str = str.replace(idSuffix, '')
  str = str.replace(underbar, ' ')
  if (!lowFirstLetter) {
    str = capitalize(str)
  }
  return str
}

export function camelize(string, lowFirstLetter) {
  var str = string.toLowerCase()
  var str_path = str.split('/')

  for (var i = 0; i < str_path.length; i++) {
    var strArr = str_path[i].split('_')
    var initX = lowFirstLetter && i + 1 === str_path.length ? 1 : 0

    for (var x = initX; x < strArr.length; x++) {
      strArr[x] = strArr[x].charAt(0).toUpperCase() + strArr[x].substring(1)
    }

    str_path[i] = strArr.join('')
  }
  str = str_path.join('')
  return str
}

export function underscore(str) {
  var str_path = str.split('::')
  for (var i = 0; i < str_path.length; i++) {
    str_path[i] = str_path[i].replace(uppercase, '_$1')
    str_path[i] = str_path[i].replace(underbarPrefix, '')
  }
  str = str_path.join('/').toLowerCase()
  return str
}

export function dasherize(str) {
  str = str.replace(spaceOrUnderbar, '-')
  return str
}

export function titleize(string) {
  var str = string.toLowerCase()
  str = str.replace(underbar, ' ')
  var strArr = str.split(' ')
  for (var x = 0; x < strArr.length; x++) {
    var d = strArr[x].split('-')
    for (var i = 0; i < d.length; i++) {
      if (non_titlecased_words.indexOf(d[i].toLowerCase()) < 0) {
        d[i] = capitalize(d[i])
      }
    }
    strArr[x] = d.join('-')
  }
  str = strArr.join(' ')
  str = str.substring(0, 1).toUpperCase() + str.substring(1)
  return str
}

export function demodulize(str) {
  var strArr = str.split('::')
  str = strArr[strArr.length - 1]
  return str
}

export function tableize(str) {
  return this.pluralize(this.underscore(str))
}

export function classify(str) {
  return this.singularize(this.camelize(str))
}

export function foreign_key(str, dropIdUbar) {
  str = this.underscore(this.demodulize(str)) + (dropIdUbar ? '' : '_') + 'id'
  return str
}

export function ordinalize(str) {
  var strArr = str.split(' ')
  for (var x = 0; x < strArr.length; x++) {
    var i = parseInt(strArr[x])
    if (i !== NaN) {
      var ltd = strArr[x].substring(strArr[x].length - 2)
      var ld = strArr[x].substring(strArr[x].length - 1)
      var suf = 'th'
      if (ltd != '11' && ltd != '12' && ltd != '13') {
        if (ld === '1') {
          suf = 'st'
        } else if (ld === '2') {
          suf = 'nd'
        } else if (ld === '3') {
          suf = 'rd'
        }
      }
      strArr[x] += suf
    }
  }
  str = strArr.join(' ')
  return str
}
