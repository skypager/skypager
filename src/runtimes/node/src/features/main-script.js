import { Feature } from '@skypager/runtime/lib/feature'

export default class MainScriptFeature extends Feature {
  shortcut = 'mainScript'

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

  get mainScriptType() {
    return 'script'
  }

  get skypagerMainPath() {
    const { runtime } = this
    const { main = `skypager.js` } = runtime.argv
    return runtime.resolve(main)
  }

  get mainScriptExists() {
    return this.runtime.fsx.existsSync(this.skypagerMainPath)
  }

  async readMainScript() {
    return this.runtime.fsx.readFileAsync(this.skypagerMainPath).then(buf => buf.toString())
  }

  async loadMainModule(options = {}, context = {}) {
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

    return this.toCodeRunner({ code, ...options }, context)()
      .then(result => {
        this.runtime.state.set('mainScriptLoaded', true)
        this.runtime.emit('mainScriptDidLoad')
        return result
      })
      .catch(error => {
        this.runtime.state.set('mainScriptError', { message: error.message, stack: error.stack })
        this.runtime.emit('mainScriptDidFail', error)

        return { error }
      })
  }

  toCodeRunner(options = {}, context = {}) {
    const { code = this.runtime.fsx.readFileSync(this.skypagerMainPath).toString() } = options

    return this.runtime.createCodeRunner(code, options, {
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
        'Runtime'
      ),
      console,
      process,
      get testGlobal() {
        return this
      },
      ...context,
    })
  }

  toModule(options = {}, context = {}) {
    const { code = this.runtime.fsx.readFileSync(this.skypagerMainPath).toString() } = options
    return this.runtime.createModule(code, options, context)
  }
}
