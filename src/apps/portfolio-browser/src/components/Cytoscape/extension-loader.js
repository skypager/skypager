import entries from 'lodash/entries'
import isString from 'lodash/isString'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'

export const assetLoader = createLoader()

export default assetLoader

export async function unpkg(...args) {
  let [dependencies = {}, options = {}] = args

  if (isString(dependencies) && isString(options)) {
    dependencies = {
      [dependencies]: options,
    }
    options = {}
  }

  const { protocol = 'https' } = options

  let callsToLoad = []

  const modules = {}

  // they already passed us entries
  if (isArray(dependencies) && isArray(dependencies[0])) {
    callsToLoad = dependencies
  } else if (isObject(dependencies)) {
    callsToLoad = entries(dependencies)
  }

  await promiseSerial(
    callsToLoad.map(([globalVariableName, packageName]) => {
      return () => {
        const unpkgUrl = packageName.startsWith('http')
          ? packageName
          : `${protocol}://unpkg.com/${packageName}`

        if (global[globalVariableName]) {
          return Promise.resolve((modules[globalVariableName] = global[globalVariableName]))
        } else {
          return assetLoader
            .js(unpkgUrl)
            .then(() => (modules[globalVariableName] = global[globalVariableName]))
        }
      }
    })
  )

  return modules
}

export function createLoader() {
  // Function which returns a function: https://davidwalsh.name/javascript-functions
  function _load(tag) {
    return function(url, options = {}) {
      // This promise will be used by Promise.all to determine success or failure
      return new Promise(function(resolve, reject) {
        var element = document.createElement(tag)
        var parent = 'body'
        var attr = 'src'

        // Important success and error for the promise
        element.onload = function() {
          resolve(url)
        }
        element.onerror = function() {
          reject(url)
        }

        // Need to set different attributes depending on tag type
        switch (tag) {
          case 'script':
            element.async = true
            if (options.babel) {
              element.type = 'text/babel'
              element['data-presets'] = options.babelPresets || 'es2015,stage-2,react'
            }
            break
          case 'link':
            element.type = 'text/css'
            element.rel = 'stylesheet'
            attr = 'href'
            parent = 'head'
        }

        // Inject into document to kick off loading
        element[attr] = url
        document[parent].appendChild(element)
      })
    }
  }

  return {
    css: _load('link'),
    js: _load('script'),
    img: _load('img'),
    unpkg,
  }
}

const promiseSerial = funcs =>
  funcs.reduce(
    (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  )
