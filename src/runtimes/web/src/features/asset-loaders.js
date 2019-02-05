export const shortcut = 'assetLoader'

export const featureMethods = ['image', 'stylesheet', 'script', 'css', 'unpkg', 'lazyInject']

export function image(url, options = {}) {
  return this.inject.img(url, options)
}

export function css(url, options = {}) {
  return this.inject.css(url, options)
}

export function stylesheet(url, options = {}) {
  return this.inject.css(url, options)
}

export function script(url, options = {}) {
  return this.inject.js(url, options)
}

/**
 * Load assets from unpkg.com by name, will asynchronously load them
 * by injecting a script tag.  The Promise will resolve when the asset
 * has been loaded.
 *
 * @param {object} dependencies - an object whose keys are the global variable name of the package,
 *                                and the value is the path to the umd build on unpkg.com
 * @param {object} options - an options hash
 * @param {string} options.protocol - http or https
 *
 * @example
 *
 *  runtime.assetLoader.unpkg({
 *    React: 'react@16.7.0/umd/react.production.min.js'
 *  })
 */
export async function unpkg(dependencies = {}, { protocol = 'https' } = {}) {
  const { entries, fromPairs } = this.lodash

  const modules = await Promise.all(
    entries(dependencies).map(([globalVariableName, packageName]) => {
      const unpkgUrl = packageName.startsWith('http')
        ? packageName
        : `${protocol}://unpkg.com/${packageName}`

      if (global[globalVariableName]) {
        return [globalVariableName, global[globalVariableName]]
      }

      return this.inject.js(unpkgUrl).then(() => {
        return [globalVariableName, global[globalVariableName]]
      })
    })
  ).then(fromPairs)

  return modules
}

export function lazyInject() {
  // Function which returns a function: https://davidwalsh.name/javascript-functions
  function _load(tag) {
    return function(url, options = {}) {
      // This promise will be used by Promise.all to determine success or failure
      return new Promise(function(resolve, reject) {
        var element = document.createElement(tag)
        var parent = 'body'
        var attr = 'src'

        window.lastElement = element

        // Important success and error for the promise
        element.onload = function() {
          console.log('loading', url)
          resolve(url)
        }
        element.onerror = function(...args) {
          console.log('error', url, ...args)
          reject(url)
        }

        // Need to set different attributes depending on tag type
        switch (tag) {
          case 'script':
            if (options.babel) {
              element.type = 'text/babel'
              // element['data-presets'] = 'es2015,stage-2,react'
            }

            if (options.async !== false) {
              element.async = true
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
        console.log('appending', element, document[parent])
        const result = document[parent].appendChild(element)
        console.log(result)
      })
    }
  }

  return {
    css: _load('link'),
    js: _load('script'),
    img: _load('img'),
  }
}
