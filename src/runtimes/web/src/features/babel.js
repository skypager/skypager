import runtime from '@skypager/runtime'

const { Feature } = runtime

/**
 * @class BabelCompiler
 * @extends Feature
 * @classdesc provides a standalone babel compiler that runs in the browser
 *

 */
export default class BabelCompiler extends Feature {
  static shortcut = 'babel'
  shortcut = 'babel'

  async featureWasEnabled(options = {}) {
    this.hide('babelConfig', this.lodash.pick(options, 'presets', 'plugins'))

    await this.loadBabel(options).catch(error => {
      this.runtime.error(`Error loading babel: ${error.message}`)
    })
  }
  /**
   * @param {String} code the code you wish to compile a sandbox
   * @param {Object} options options for the code runner
   * @returns {Function} a function which will compile your code and run it in a sandbox. This function accepts an object which will be added to the sandbox scope
   *
   * @example
   *
   * const babel = runtime.feature('babel')
   * const runner = babel.createCodeRunner(`console.log(myVar)`)
   *
   * runner({ myVar: 1 }).then((result) => {
   *   console.log(result)
   * })
   */
  createCodeRunner(code, options = {}) {
    const { runtime } = this
    const { vm } = runtime
    const { mapValues, pick } = this.lodash
    const compiled = this.compile(code)
    const script = vm.createScript(compiled)

    return (vars = {}) => {
      const sandbox = vm.createContext({
        ...pick(runtime.sandbox, 'mobx', 'lodash'),
        ...pick(global, 'React', 'ReactDOM', 'ReactRouter'),
        ...(global.semanticUIReact || {}),
      })

      mapValues(vars, (v, k) => {
        sandbox[k] = v
      })

      const result = script.runInContext(sandbox)

      this.lastSandbox = sandbox

      return options.sandbox ? { vars, result, sandbox, compiled } : result
    }
  }
  /**
   * Compile es6 code with babel
   *
   * @param {String} code
   * @param {Object} [options={}] options to pass to babel
   * @returns {String} the compiled code
   * @memberof BabelCompiler
   */
  compile(code, options = {}) {
    const { Babel } = global
    const { omit } = this.lodash

    const babelOptions = {
      presets: ['es2015', ['stage-2', { decoratorsLegacy: true }], 'react'],
      ...(this.babelConfig || {}),
      ...omit(options, 'sandbox'),
    }

    return Babel.transform(code, babelOptions).code
  }

  /**
   * @property {{ createScript: function, createContext: function, runInContext: function, runInThisContext: function }} vm the vm module interface
   * @memberof BabelCompiler
   */
  get vm() {
    return this.runtime.vm
  }

  /**
   * Waits until Babel standalone compiler is available
   *
   * @param {Function} [fn] use a callback style, omitting this value will return a promise
   * @returns {PromiseLike}
   * @memberof BabelCompiler
   */
  whenReady(fn) {
    if (typeof fn === 'undefined') {
      return new Promise((resolve, reject) => {
        this.whenReady((err, Babel) => {
          err ? reject(err) : resolve(Babel)
        })
      })
    }

    if (this.ready) {
      fn(null, global.Babel)
    } else {
      this.once('ready', Babel => {
        fn(null, Babel)
      })
    }
  }

  /**
   * Loads the Babel standalone library
   * @private
   */
  async loadBabel(options = {}) {
    const { runtime } = this
    const { assetLoader } = runtime

    if (this.loading) {
      return new Promise(resolve => {
        setTimeout(resolve, 20)
      }).then(() => this.loadBabel())
    }

    if (global.Babel) {
      this.ready = true
      this.emit('ready', global.Babel)
      return global.Babel
    }

    this.loading = true
    await assetLoader.inject.js(`https://unpkg.com/@babel/standalone@7.0.0/babel.min.js`)

    this.ready = true
    this.loading = false

    this.emit('ready', global.Babel)
    return global.Babel
  }
}
