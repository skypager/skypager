export const hostMethods = ['createCodeRunner', 'createModule', 'createScript', 'createContext']

export function featureWasEnabled() {
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

export function createModule(code, options = {}, sandbox) {
  sandbox = sandbox || this.sandbox
  const wrapped = `(function (exports, require, module, __filename, __dirname) {\n\n${code}\n\n});`
  const script = this.createScript(wrapped)
  const context = this.createContext(sandbox)

  const filename = options.filename || this.resolve(this.hashObject({ code }) + '.js')
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

export function createCodeRunner(code, options = {}, sandbox) {
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

export function createScript(code = '', options = {}) {
  return new this.vm.Script(code.toString(), options)
}
