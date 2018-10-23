import {
  readJsonAsync as readJson,
  readdirAsync as readdir,
  existsAsync as exists,
} from 'fs-extra-promise'
import { resolve, basename, join } from 'path'
import pathMatcher from '@skypager/runtime/lib/utils/path-matcher'
import semver from 'semver'

const { all } = Promise

export const featureMethods = [
  'findByName',
  'findPackageFoldersIn',
  'getSemver',
  'testPath',
  'find',
  'findPackageLocations',
  'findNearest',
  'attemptResolve',
  'getCachedModuleIds',
  'getCurrentModule',
  'getCurrentModulePaths',
  'findParentPackage',
]

export function featureWasEnabled() {
  this.runtime.feature('script-runner').enable()
}

export function getCurrentModule() {
  return this.get('runtime.currentModule')
}

export function getCurrentModulePaths() {
  return this.result(
    'runtime.currentModule.paths',
    () => this.runtime.vm.runInThisContext(`process.mainModule.paths`) || []
  )
}

export const hostMethods = ['getPackageFinder', 'findPackages', 'findPackage']

export function getCachedModuleIds() {
  return Object.keys(require.cache || {})
}

/**
  Attempt to resolve a module to a requireable path. Returns false instead
  of throwing an error when the resolution fails.

  @param {String} name the name of the module to resolve to a location
*/
export function attemptResolve(options = {}) {
  if (typeof options === 'string') {
    options = { name: options }
  }

  const { debug = false, name } = options

  try {
    return require.resolve(name)
  } catch (error) {
    if (debug) {
      console.error(`Error while resolving: ${name}`)
    }
    return false
  }
}

export function getPackageFinder() {
  return this.feature('package-finder')
}

export function findPackages(...args) {
  return this.packageFinder.find(...args)
}

export function findPackage(...args) {
  return this.packageFinder.findByName(...args)
}

export function findNearest(options = {}) {
  return this.runtime.fsx.findUpAsync('package.json', options)
}

export function findParentPackage(options = {}) {
  return this.runtime.fsx.findUpAsync('package.json', {
    cwd: this.runtime.resolve('..'),
    ...options,
  })
}

const toSubject = fullPath => {
  const { sep } = require('path')
  const parts = fullPath.split(sep)
  const subject = parts
    .slice(parts.length - 2)
    .filter(item => !item.match(/node_modules/))
    .join('/')

  return subject
}

export async function find(options = {}, context = {}) {
  const { runtime } = this
  const { get, flatten, isArray, isFunction, isRegExp, isString } = runtime.lodash

  if (isRegExp(options)) options = { ...context, rules: [...(context.rules || []), options] }
  if (isString(options)) options = { ...context, rules: [...(context.rules || []), options] }
  if (isArray(options)) options = { ...context, rules: [...(context.rules || []), ...options] }
  if (isFunction(options)) options = { ...context, rules: [...(context.rules || []), options] }

  let rules = options.rules || []

  const { rule, moduleFolderName = 'node_modules', parse = false, filter } = options

  if (rule) {
    rules.push(rule)
  }

  rules = rules.map(
    rule =>
      isString(rule) && rule.match(/\*|\:|\+/)
        ? val => require('path-to-regexp')(rule).test(val)
        : rule
  )

  const packageStores = await this.findPackageLocations({
    ...options,
    moduleFolderName,
  })

  let packagePaths = await Promise.all(
    packageStores.map(baseFolder => this.findPackageFoldersIn(baseFolder))
  ).then(flatten)

  if (parse === false) {
    return packagePaths.filter(p => testPath(toSubject(p), rules))
  } else if (parse === 'matches') {
    packagePaths = flatten(packagePaths).filter(p => testPath(toSubject(p), rules))
  } else if (parse === true) {
    packagePaths = flatten(packagePaths)
  }

  const packageData = await Promise.all(
    packagePaths.map(p =>
      readJson(join(p, 'package.json')).then(data => ({
        ...data,
        file: { path: join(p, 'package.json'), dirname: p },
      }))
    )
  )

  const { gt, lt, satisfies, clean } = semver
  let {
    depends,
    version,
    minimum: minimumOpt,
    satisfies: satisfiesOpt,
    maximum: maximumOpt,
  } = options

  return packageData.filter(p => {
    if (!p.name) return false
    if (minimumOpt && !gt(p.version, clean(minimumOpt))) return false
    if (maximumOpt && !lt(p.version, clean(maximumOpt))) return false
    if (satisfiesOpt && !satisfies(p.version, clean(satisfiesOpt))) return false
    if (version && clean(version) !== clean(p.version)) return false

    if (
      depends &&
      !(
        get(p, ['dependencies', depends.toLowerCase()]) ||
        get(p, ['devDependencies', depends.toLowerCase()]) ||
        get(p, ['optionalDependencies', depends.toLowerCase()]) ||
        get(p, ['peerDependencies', depends.toLowerCase()])
      )
    ) {
      return false
    }

    if (!testPath(p.name, rules)) {
      return false
    }

    if (!filter) {
      return true
    }

    if (typeof filter === 'function') {
      return !!filter.call(runtime, p, options, context)
    } else if (typeof filter === 'string') {
      return !!get(p, filter)
    }

    return true
  })
}

export function testPath(pathToTest, rulesToTestWith) {
  return pathMatcher(rulesToTestWith, pathToTest)
}

export function getSemver() {
  return semver
}

export async function findPackageLocations(options = {}) {
  const { runtime } = this
  const { flatten } = runtime.lodash

  let { testPaths = this.currentModulePaths || [] } = options

  const { additionalPaths = [], moduleFolderName = 'node_modules' } = options

  if (moduleFolderName !== 'node_modules') {
    testPaths = testPaths.map(v => v.replace(/node_modules/, moduleFolderName))
  }

  return allExisting(testPaths || [])
}

export async function findPackageFoldersIn(basePath) {
  let folderNames = await readdir(basePath)

  // support @scoped packages
  folderNames = await Promise.all(
    folderNames.map(
      folderName =>
        folderName.startsWith('@')
          ? readdir(join(basePath, folderName)).map(base =>
              [folderName, base].join(require('path').sep)
            )
          : folderName
    )
  ).then(this.lodash.flatten)

  const manifestPathLocations = folderNames.map(n => join(basePath, n, 'package.json'))

  const existing = await allExisting(manifestPathLocations)

  return existing.map(p => resolve(p, '..'))
}

export async function findByName(name, options = {}) {
  const results = await this.find({
    ...options,
    rule: `${name}$`,
  })

  return results[0]
}

export const findExistingPaths = (paths = []) => allExisting(paths)

export async function allExisting(paths = []) {
  if (paths.length === 0) return []

  try {
    const results = await Promise.all(paths.map(p => exists(p).then(res => res && p)))

    return results.filter(v => v)
  } catch (error) {
    return []
  }

  return []
}
