import { Feature } from '../feature'

/**
 * @class VmFeature
 * @extends Feature
 * @classdesc The Feature helper encapsulates any functionality provided by a module, in a stateful object that can be configured and enabled at runtime
 * whenever it is needed by an application.  The @skypager/node runtime is just a collection of features that only make sense in a node process.  A web process
 * could mimic the node feature interface, and swap out direct file access with a rest controller.  A Feature exists to provide a common abstract interface for platform functionality.
 *
 * @example
 *
 *  runtime.feature('vm').enable()
 *
 *  const { exports: exp } = runtime.createModule(`
 *    module.exports = {
 *      hello: 'World'
 *    }
 *  `)
 *
 *   console.log(exp.hello) // => 'World'
 *
 */
export default class VmFeature extends Feature {
  /**
   * When the vm is enabled, these methods get mixed into the runtime itself
   */
  static hostMethods = ['createCodeRunner', 'createModule', 'createScript', 'createContext']

  /**
   * Creates a function which will asynchronously run a string of code in a given
   * vm context.  By default, that is the sandbox
   *
   * @static
   * @param {*} code
   * @param {Object} [options={}]
   * @param {Object} sandbox
   * @returns {Function}
   * @memberof Runtime
   */
  static createCodeRunner(code, options = {}, sandbox) {
    const { vm } = this
    const { thisContext = false } = options
    const { hashObject } = this.propUtils

    sandbox = sandbox || this.sandbox

    const vmContext = (vm.isContext
    ? vm.isContext(sandbox)
    : false)
      ? sandbox
      : !thisContext && vm.createContext(sandbox)

    return async function(argv = {}) {
      const throwErrors = options.throwErrors || argv.throwErrors

      const script =
        typeof code === 'function'
          ? vm.createScript(
              code.call(this, { displayErrors: true, ...options, ...argv }, sandbox),
              options
            )
          : vm.createScript(code, { displayErrors: true, ...options, ...argv })

      try {
        const result = vmContext
          ? script.runInContext(vmContext)
          : thisContext
          ? script.runInThisContext()
          : script.runInNewContext(sandbox)

        return {
          result,
          code,
          usedContext: vmContext ? 'vmContext' : thisContext ? 'thisContext' : 'sandboxedContext',
          hash: hashObject({ code }),
        }
      } catch (error) {
        if (throwErrors) {
          throw error
        }

        return {
          error: {
            message: error.message,
            stack: error.stack,
          },
          code,
        }
      }
    }
  }
  /**
   * Creates a function which will asynchronously evaluate a string of code in the provided context, (i.e. with the object you pass treated as what is in scope in the code)
   */

  /**
   * Creates a module from a string of code.  The string of code will be evaluated with the standard module, module.exports, require, __dirname, __filename being defined,
   * as well as any other global context you provide.  The returned object will have module.exports on it and can be used as normal.
   */
  static createModule = createModule

  /**
   * Creates a vm script object from a string of code
   */
  static createScript = createScript

  /**
   * Creates a vm sandbox, which you can run scripts in.  Any changes made by the script to the sandbox will persist between runs.
   */
  static createContext = createContext

  /**
   * This makes sure the runtime has a vm property that will work in that environment.  The browser needs vm-browserify to work
   */
  featureWasEnabled() {
    if (this.runtime.isNode) {
      this.runtime.hide('vm', require('vm'))
    } else {
      const vmBrowserify = require('vm-browserify')
      this.runtime.hide(
        'vm',
        vmBrowserify.createContext ? vmBrowserify : vmBrowserify.default || vmBrowserify
      )
    }
  }
}

export function createModule(code, options = {}, sandbox) {
  sandbox = sandbox || this.sandbox
  const wrapped = `(function (exports, require, module, __filename, __dirname) {\n\n${code}\n\n});`
  const script = this.createScript(wrapped)
  const context = this.createContext(sandbox)
  const hash = this.hashObject({ code })

  const filename = options.filename || (this.resolve ? this.resolve(`${hash}.js`) : `${hash}.js`)
  const id = options.id || filename
  const dirname = options.dirname || this.cwd || '/'

  const req = options.require || this.get('currentModule.require')

  const newModule = {
    id,
    children: [],
    parent: undefined,
    require: req,
    exports: {},
    loaded: false,
  }

  newModule.require = req

  const moduleLoader = () =>
    script.runInContext(context)(newModule.exports, newModule.require, newModule, filename, dirname)

  if (options.lazy) {
    return moduleLoader
  } else {
    moduleLoader()
    newModule.loaded = true
    newModule.parent = this.get('currentModule') || {}
    return newModule
  }
}

export function createContext(options = {}) {
  return this.vm.createContext({
    ...this.sandbox,
    ...options,
  })
}

export function createScript(code = '', options = {}) {
  return new this.vm.Script(code.toString(), options)
}
