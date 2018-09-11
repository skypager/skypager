export const createGetter = 'mainScript'

export const featureMethods = [
  'getMainScriptType',
  'getSkypagerMainPath',
  'lazyMainScriptExists',
  'loadMainModule',
  'runMainScript',
  'readMainScript',
  'toModule',
  'toCodeRunner',
  'whenReady',
]

export function whenReady() {
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

export function getMainScriptType() {
  return 'script'
}

export function getSkypagerMainPath() {
  const { runtime } = this
  const { main = `skypager.js` } = runtime.argv
  return runtime.resolve(main)
}

export function lazyMainScriptExists() {
  return this.runtime.fsx.existsSync(this.skypagerMainPath)
}

export async function readMainScript() {
  return this.runtime.fsx.readFileAsync(this.skypagerMainPath).then(buf => buf.toString())
}

export async function loadMainModule(options = {}, context = {}) {
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

export async function runMainScript(options = {}, context = {}) {
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
      context.require.resolve = __non_webpack_require__.resolve
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

export function toCodeRunner(options = {}, context = {}) {
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

export function toModule(options = {}, context = {}) {
  const { code = this.runtime.fsx.readFileSync(this.skypagerMainPath).toString() } = options
  return this.runtime.createModule(code, options, context)
}
