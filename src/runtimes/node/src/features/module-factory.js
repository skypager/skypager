import Module from 'module'
import { Feature } from '@skypager/runtime'

export default class ModuleFactory extends Feature {
  static shortcut = 'moduleFactory'

  get currentModule() {
    const manifestPath = this.runtime.resolve('package.json')

    const mod = new Module(manifestPath)

    mod.filename = manifestPath
    mod.paths = Module._nodeModulePaths(this.runtime.pathUtils.dirname(manifestPath))

    return mod
  }

  fromPath(filename, options = {}, sandbox) {
    const code = this.runtime.fsx.readFileSync(this.runtime.resolve(filename)).toString()
    return this.fromString(code, { filename, ...options }, options.context || sandbox)
  }

  fromString(code, options = {}, sandbox) {
    const { filename } = options
    return this.runtime.createModule(
      code,
      {
        require: this.createRequireFunction(filename),
      },
      options.context || sandbox
    )
  }

  createRequireFunction(path, uncached) {
    const { dirname } = this.runtime.pathUtils

    var parentModule = new Module(path)
    parentModule.filename = path
    parentModule.paths = Module._nodeModulePaths(dirname(path))

    function requireLike(file) {
      var cache = Module._cache
      if (uncached) {
        Module._cache = {}
      }

      var exports = Module._load(file, parentModule)
      Module._cache = cache

      return exports
    }

    requireLike.resolve = function(request) {
      var resolved = Module._resolveFilename(request, parentModule)
      // Module._resolveFilename returns a string since node v0.6.10,
      // it used to return an array prior to that
      return resolved instanceof Array ? resolved[1] : resolved
    }

    try {
      requireLike.paths = require.paths
    } catch (e) {
      // require.paths was deprecated in node v0.5.x
      // it now throws an exception when called
    }
    requireLike.main = process.mainModule
    requireLike.extensions = require.extensions
    requireLike.cache = require.cache

    return requireLike
  }
}
