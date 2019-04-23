import { Feature } from '@skypager/runtime/lib/feature'

/**
 * @class MainScriptFeature
 * @classdesc Loads a configured main script for the skypager project, configured in the package.json skypager.main property.
 * This script will be run in the context of the runtime's sandbox, and can export a module with attach and start functions that
 * will be called asycnhronously.
 *
 */
export default class MainScriptFeature extends Feature {
  shortcut = 'mainScript'

  /**
   * Resolves when the main script has been loaded and applied
   *
   * @returns {PromiseLike}
   * @memberof MainScriptFeature
   */
  whenReady() {
    const { runtime } = this

    return new Promise((resolve, reject) => {
      const isLoaded = runtime.state.get('mainScriptLoaded')
      const isFailed = runtime.state.get('mainScriptError')

      if (isLoaded) {
        resolve(runtime)
      } else if (isFailed) {
        reject(
          new Error(
            runtime.get('currentState.mainScriptError.message', 'Main Script Failed when loadeing')
          )
        )
      } else {
        runtime.once('mainScriptDidLoad', () => {
          resolve(runtime)
          runtime.off('mainScriptDidFail')
        })

        runtime.once('mainScriptDidFail', e => reject(e))
      }
    })
  }

  /**
   * Returns whatever the main script exports, if anything
   *
   * @readonly
   * @memberof MainScriptFeature
   */
  get mainExports() {
    try {
      return this.toModule().exports
    } catch (error) {
      return {}
    }
  }

  get mainScriptType() {
    return 'script'
  }

  /**
   * Returns the path to the main script
   *
   * @readonly
   * @memberof MainScriptFeature
   */
  get skypagerMainPath() {
    const { runtime } = this
    const { main = `skypager.js` } = runtime.argv
    return runtime.resolve(main)
  }

  /**
   * Returns true if a file exists at the main script path
   *
   * @readonly
   * @memberof MainScriptFeature
   */
  get mainScriptExists() {
    return this.runtime.fsx.existsSync(this.skypagerMainPath)
  }

  async readMainScript() {
    return this.runtime.fsx.readFileAsync(this.skypagerMainPath).then(buf => buf.toString())
  }

  async loadMainModule(options = {}, context = this.runtime.sandbox) {
    const code = await this.readMainScript()
    return this.toModule(
      {
        code,
        filename: this.skypagerMainPath,
        dirname: this.runtime.pathUtils.dirname(this.skypagerMainPath),
        ...options,
      },
      context
    )
  }

  async runMainScript(options = {}, context = {}) {
    if (!this.mainScriptExists) {
      // this.runtime.debug('Could not find main script', { path: this.skypagerMainPath })
      this.runtime.state.set('mainScriptLoaded', true)
      this.runtime.emit('mainScriptDidLoad')
      return
    }

    const code = await this.readMainScript()

    if (!context.require) {
      if (process.mainModule && process.mainModule.require && process.mainModule.require) {
        context.require = context.require || process.mainModule.require
        context.require.resolve = require.resolve
      }
    }

    const { isEmpty } = this.lodash

    try {
      const { exports: exp } = this.toModule({ code })

      // it could have been a script
      if (isEmpty(exp)) {
      } else {
        if (typeof exp.start === 'function') {
          this.runtime.use(function(done) {
            exp
              .start(this.runtime)
              .then(() => done())
              .catch(error => done(error))
          })
        }

        if (typeof exp.attach === 'function') {
          Promise.resolve(exp.attach(this.runtime))
        }
      }

      this.runtime.state.set('mainScriptLoaded', true)
      this.runtime.emit('mainScriptDidLoad')

      return exp
    } catch (error) {
      console.error(`Error in main script`, error.message, error.stack)
      this.runtime.state.set('mainScriptError', { message: error.message, stack: error.stack })
      this.runtime.emit('mainScriptDidFail', error)
    }
  }

  toCodeRunner(options = {}, context = {}) {
    const { code = this.runtime.fsx.readFileSync(this.skypagerMainPath).toString() } = options

    options.filename = options.filename || this.skypagerMainPath
    options.dirname = options.dirname || this.runtime.pathUtils.dirname(this.skypagerMainPath)

    const sandbox = {
      runtime: this.runtime,
      skypager: this.runtime,
      ...this.runtime.slice(
        'pathUtils',
        'lodash',
        'stringUtils',
        'urlUtils',
        'proc',
        'mobx',
        'packageFinder',
        'fileManager',
        'Helper',
        'Runtime',
        'Feature'
      ),
      console,
      process,
      ...context,
      setTimeout,
      setInterval,
    }

    sandbox.global = sandbox

    if (!sandbox.require) {
      if (process.mainModule && process.mainModule.require && process.mainModule.require) {
        sandbox.require = sandbox.require || process.mainModule.require
        sandbox.require.resolve = sandbox.require.resolve
      }
    }

    return this.runtime.createCodeRunner(code, options, context)
  }

  toModule(options = {}, context = {}) {
    const { code = this.runtime.fsx.readFileSync(this.skypagerMainPath).toString() } = options

    options.filename = options.filename || this.skypagerMainPath
    options.dirname = options.dirname || this.runtime.pathUtils.dirname(this.skypagerMainPath)

    const sandbox = {
      runtime: this.runtime,
      skypager: this.runtime,
      ...this.runtime.slice(
        'pathUtils',
        'lodash',
        'stringUtils',
        'urlUtils',
        'proc',
        'mobx',
        'packageFinder',
        'fileManager',
        'Helper',
        'Runtime',
        'Feature'
      ),
      console,
      process,
      ...context,
      setTimeout,
      setInterval,
    }

    sandbox.global = sandbox

    if (!sandbox.require) {
      if (process.mainModule && process.mainModule.require && process.mainModule.require) {
        sandbox.require = sandbox.require || process.mainModule.require
        sandbox.require.resolve = sandbox.require.resolve
      }
    }

    return this.runtime.createModule(code, options, sandbox)
  }
}
