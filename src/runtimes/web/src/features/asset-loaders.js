import { Feature } from '@skypager/runtime'

/**
 * @class AssetLoader
 * @extends Feature
 * @classdesc The AssetLoader feature provides async helpers for injecting static asset elements into the page,
 * as well as helpers for loading javascript packages into the global scope from unpkg.com
 */
export default class AssetLoader extends Feature {
  static shortcut = 'assetLoader'

  shortcut = 'assetLoader'

  initialize() {
    this.lazy('inject', () => this.lazyInject())
  }

  /**
   * Injects an image tag into the DOM
   *
   * @param {String} url - the url of the image
   * @param {Object} [options={}] - options for element creation
   * @returns {PromiseLike<HtmlElement>}
   * @memberof AssetLoader
   */
  image(url, options = {}) {
    return this.inject.img(url, options)
  }

  /**
   * Injects a stylesheet link tag into the DOM
   *
   * @param {String} url - the url of the stylesheet
   * @param {Object} [options={}] - options for element creation
   * @returns {PromiseLike<HtmlElement>}
   * @memberof AssetLoader
   */
  css(url, options = {}) {
    return this.inject.css(url, options)
  }

  /**
   * Injects a stylesheet link tag into the DOM
   *
   * @param {String} url - the url of the stylesheet
   * @param {Object} [options={}] - options for element creation
   * @returns {PromiseLike<HtmlElement>}
   * @memberof AssetLoader
   */
  stylesheet(url, options = {}) {
    return this.inject.css(url, options)
  }

  /**
   * Injects a script tag into the DOM
   *
   * @param {String} url - the url of the stylesheet
   * @param {Object} [options={}] - options for element creation
   * @param {Boolean} [options.babel=false] - add type=text/babel attribute, also fire a hack event to support lazy loading scripts
   * @param {Number} [options.delay=400] - how long to wait until firing the fake DOMContentLoaded event to trick babel-standalone
   * @returns {Promise<HTMLElement>}
   * @memberof AssetLoader
   */
  script(url, options = {}) {
    const result = this.inject.js(url, options)

    if (options.babel) {
      setTimeout(() => {
        window.dispatchEvent(new Event('DOMContentLoaded'))
      }, options.delay || 400)
    }

    return result
  }

  /**
   * Load assets from unpkg.com by name, will asynchronously load them
   * by injecting a script tag.  The Promise will resolve when the asset
   * has been loaded.
   *
   * @param {Object} dependencies - an object whose keys are the global variable name of the package,
   * @param {Object} options - an options hash
   * @param {String} options.protocol - http or https
   * @returns {Object<String,Object>} returns an object whose keys are the global variable name, and whose values are the libraries that were injected
   * @memberof AssetLoader
   *
   * @example
   *
   *  runtime.assetLoader.unpkg({
   *    React: 'react@16.7.0/umd/react.production.min.js',
   *    ReactDOM: 'react-dom@16.7.0/umd/react-dom.production.min.js'
   *  })
   */
  async unpkg(dependencies = {}, { protocol = 'https' } = {}) {
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

  lazyInject() {
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
          element.onerror = function(...args) {
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

          const result = document[parent].appendChild(element)
        })
      }
    }

    return {
      css: _load('link'),
      js: _load('script'),
      img: _load('img'),
    }
  }
}
