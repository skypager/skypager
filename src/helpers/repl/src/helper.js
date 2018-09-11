import { Helper } from '@skypager/runtime'
import { start } from 'repl'
import Promise from 'bluebird'

const { createContextRegistry } = Helper

const priv = new WeakMap()

export class Repl extends Helper {
  initialize() {
    this.loadedCommands = []
    this.loadedExtensions = []

    if (!priv.has(this)) {
      priv.set(this, new Map())
    }

    const privates = priv.get(this)

    privates.fetch = (key, fn) => {
      if (privates.has(key)) {
        return privates.get(key)
      } else if (fn && typeof fn === 'function') {
        const result = fn(key)

        if (result) {
          privates.set(key, result)
          return result
        }
      } else if (fn && typeof fn !== 'function') {
        privates.set(key, fn)
        return fn
      }
    }

    this.hideGetter('privates', () => privates)

    let replServer

    this.hideGetter('replServer', () => {
      this.repl
      replServer
    })

    this.lazy(
      'repl',
      () => {
        try {
          this.attemptMethod('replWillCreate', this.replOptions)

          replServer = this.createReplServer()

          // const serverContext = this.buildContext(replServer.context)

          replServer.on('reset', ctx => {
            this.attemptMethod('replDidReset', ctx, replServer)
            // const newContext = this.buildContext({})
          })

          replServer.on('exit', this.replDidExit.bind(this))

          this.attemptMethod('replWasCreated', replServer)

          return replServer
        } catch (error) {}
      },
      true
    )
  }

  get replOptions() {
    const replOptions = this.privates.get('replOptions')
    if (replOptions) {
      return replOptions
    }

    return this.privates.fetch('replOptions', () => this.buildReplOptions())
  }

  buildReplOptions(i = {}) {
    const toObj = val =>
      typeof val === 'function' ? val.call(this, this.options, this.context) : val || {}
    const suppliedAsOptions = toObj(this.get('options.replOptions', () => ({})))
    const suppliedByProvider = toObj(this.get('provider.replOptions', () => ({})))

    const replOptions = this.lodash.defaults({}, i, suppliedAsOptions, suppliedByProvider, {
      useGlobal: this.tryGet('useGlobal', false),
      ignoreUndefined: this.tryGet('ignoreUndefined', true),
      colors: this.tryGet('colors', true),
      terminal: this.tryGet('isTerminal', true),
    })

    if (!replOptions.eval && !this.tryGet('evalFn')) {
      replOptions.eval = this.promiseEvalFn
    }

    if (!replOptions.writer && this.tryGet('writerFn')) {
      replOptions.writer = this.tryGet('writerFn')
    }

    return replOptions
  }

  replDidExit() {
    if (this.tryGet('replDidExit')) return this.callMethod('replDidExit')
    this.runtime.fireHook('replDidExit', this, this.repl)
  }

  launch(context = {}) {
    this.attemptMethod('replWillLaunch')

    this.attemptMethod('displayBanner')

    this.updateContext(context)

    this.attemptMethod('displayHelp')

    this.attemptMethod('replDidLaunch')

    return this
  }

  get cli() {
    return require('skypager-repl/dist/cli').default
  }

  processCommand(commandInput) {
    return commandInput
  }

  resetContext(newContextValues = {}) {
    this.invoke('repl.reset')

    Object.keys(this.repl.context).forEach(key => {
      delete this.repl.context[key]
    })

    this.updateContext({
      ...this.buildContext(this.repl.context),
      ...newContextValues,
    })

    return this
  }

  updateContext(properties = {}) {
    Object.keys(properties).forEach(k => {
      try {
        this.updateContextVariable(k, properties[k])
      } catch (error) {}
    })
    return this
  }

  get cachedModuleIds() {
    return Object.keys(__non_webpack_require__.cache)
  }

  updateContextVariable(variableName, value) {
    delete this.repl.context[variableName]

    Object.defineProperty(this.repl.context, variableName, {
      enumerable: true,
      configurable: true,
      get() {
        return value
      },
    })

    return this
  }

  buildContext(context = {}) {
    const builder = this.tryGet('buildContext')

    const built =
      typeof builder === 'function'
        ? builder.call(this, context, this.context)
        : { ...this.context, ...context, ...(builder || {}) }

    Object.keys(built).forEach(key => {
      Object.defineProperty(context, key, {
        enumerable: true,
        configurable: true,
        get() {
          return built[key]
        },
      })
    })

    return context
  }

  get isAsync() {
    return this.tryResult('isAsync', true)
  }

  get evalTimeout() {
    return this.tryGet('evalTimeout', 5000)
  }

  get codeRunner() {
    if (!this.currentCodeRunner) {
      return this.defaultEvalFn
    } else if (typeof this.currentCodeRunner === 'string') {
      return this.runners.lookup(this.currentCodeRunner).run.bind(this)
    } else if (typeof this.currentCodeRunner === 'function') {
      return this.currentCodeRunner.bind(this)
    }
  }

  get replOutput() {
    if (this.privates.has('replOutput')) {
      return this.privates.get('replOutput')
    }

    const output = this.tryResult('output', this.tryResult('replOutput', () => process.stdout))

    this.privates.set('replOutput', output)

    return output
  }

  get replInput() {
    if (this.privates.has('replInput')) {
      return this.privates.get('replInput')
    }

    const input = this.tryResult('input', this.tryResult('replInput', () => process.stdin))

    this.privates.set('replInput', input)

    return input
  }

  createReplServer(options = {}, callback) {
    this.privates.set(
      'createOptions',
      this.lodash.defaults({}, options, this.replOptions, {
        input: this.replInput,
        output: this.replOutput,
      })
    )

    try {
      const replServer = start(this.privates.get('createOptions'))

      if (typeof callback === 'function') {
        callback.call(this, null, replServer)
      }

      return replServer
    } catch (error) {
      this.runtime.error('Error creating REPL Server', { message: error.message })

      if (typeof callback === 'function') {
        callback.call(this, error)
      } else {
        throw error
      }
    }
  }

  get vmRunner() {
    const runner = this.runners.lookup('vm').run
    return runner.bind(this)
  }

  get defaultEvalFn() {
    const runner = this.runners.lookup('vm').run
    return runner.bind(this)
  }

  get promiseEvalFn() {
    const term = this

    return (command, context, filename, callback) =>
      term.codeRunner(
        term.processCommand(command),
        context,
        filename,
        term.handlePromiseResult(command, context, callback)
      )
  }

  createRunner(options = {}) {
    const { type = 'vm' } = options

    try {
      const runner = this.runners.lookup(type)

      return runner && runner.run ? runner.run.bind(this) : this.runners.lookup('vm').run.bind(this)
    } catch (error) {
      return code => `There was an error building the REPL runner: ${error.message}`
    }
  }

  createDefaultEvalFn() {
    const runner = this.runners.lookup('vm').run
    return runner.bind(this)
  }

  createPromiseEvalFn() {
    const term = this

    return (command, context, filename, callback) =>
      term.codeRunner(
        term.processCommand(command),
        context,
        filename,
        term.handlePromiseResult(command, context, callback)
      )
  }

  setTimeoutWarning() {
    console.log('timeout warning')
  }

  finishWaiting() {
    clearTimeout(this.hangTimer)
    delete this.hangTimer
  }

  waitForResult(callback) {
    this.waitingResult = callback
  }

  handlePromiseResult(command, context, callback) {
    const term = this

    return (err, result) => {
      if (err) {
        return callback(term.handleEvalError.call(term, err, command, context))
      }

      // if the result isn't a promise then handle it and move on
      if (result && typeof result.then !== 'function') {
        return callback(null, term.handleEvalResult.call(term, result, command, context))
      } else if (!result) {
        return callback(null, term.handleEvalResult.call(term, result, command, context))
      }

      term.waitForResult(callback)

      if (result && typeof result.then === 'function') {
        Promise.resolve(result)
          .then(val => {
            callback(null, term.handleEvalResult.call(term, val, command, context))
          })
          .timeout(term.evalTimeout)
          .catch(Promise.TimeoutError, error => {
            term.setTimeoutWarning(callback)
          })
          .catch(error => {
            callback(term.handleEvalError.call(term, error, command, context))
          })
      }
    }
  }

  handleEvalError(error, command, context) {
    this.finishWaiting()
    this.fireHook('receivedError', error, command, context, this)
    return error
  }

  set unwrapLodash(val) {
    this.privates.set('unwrapLodash', !!val)
  }

  get unwrapLodash() {
    return !!this.privates.get('unwrapLodash')
  }

  handleEvalResult(result, command, context) {
    this.finishWaiting()

    try {
      if (
        this.unwrapLodash &&
        result &&
        result.value &&
        typeof result.value === 'function' &&
        result.constructor &&
        result.constructor.name === 'LodashWrapper'
      ) {
        result = result.value()
      }
    } catch (error) {}

    this.fireHook('receivedResult', result, command, context, this)

    return result
  }

  loadCommand(commandId, options = {}) {
    const c = this
    const exists = this.commands.checkKey(commandId) !== false
    const repl = options.repl || this.repl

    if (exists) {
      const provider = this.commands.lookup(commandId)
      options = { ...provider, ...options }
    }

    const { action, help, command } = options

    if (action && command) {
      repl.defineCommand(command, {
        help,
        action(...args) {
          return action.call(c, ...args.push(options))
        },
      })

      this.loadedCommands.push(commandId)
    }

    return this
  }

  loadExtension(extensionId, options = {}, ...args) {
    const c = this
    const exists = this.extensions.checkKey(extensionId) !== false
    const repl = options.repl || this.repl

    if (exists) {
      const provider = this.extensions.lookup(extensionId)
      const ext = provider.default ? provider.default : provider

      if (typeof ext === 'function') {
        ext.call(this, repl, options, ...args)
      }

      this.loadedExtensions.push(extensionId)
    }

    return this
  }

  validateExtension(provider) {
    provider = provider.default ? provider.default : provider

    if (typeof provider !== 'function') {
      throw new Error(
        'Repl extensions should be functions which are passed an instance of the console'
      )
    }
  }

  validateCommand(provider = {}) {
    const { help, command, action } = provider

    if (typeof action !== 'function') {
      throw new Error('Command extensions should export an action function')
    }

    if (typeof help === 'undefined') {
      throw new Error('Command extensions should export a short message via the help property')
    }

    if (typeof command === 'undefined') {
      throw new Error('Command extensions should export a command string property')
    }
  }

  get availableCommands() {
    return this.commands.available
  }

  get availableRunners() {
    return this.runners.available
  }

  get availableExtensions() {
    return this.extensions.available
  }

  get availableDisplays() {
    return this.displays.available
  }

  get availableRepls() {
    return this.runtime.terminals.available
  }

  get commands() {
    return this.constructor.commands
  }

  get runners() {
    return this.constructor.runners
  }

  get extensions() {
    return this.constructor.extensions
  }

  get displays() {
    return this.constructor.displays
  }

  static extensions = createContextRegistry('extensions', {
    context: require.context('./extensions', true, /\.js$/),
  })

  static commands = createContextRegistry('commands', {
    context: require.context('./commands', true, /\.js$/),
  })

  static runners = createContextRegistry('runners', {
    context: require.context('./runners', true, /\.js$/),
  })

  static displays = createContextRegistry('displays', {
    context: require.context('./displays', true, /\.js$/),
  })

  static isCacheable = true

  static attach(host, options = {}) {
    const {
      registryProp = 'repls',
      lookupProp = 'repl',
      registry = createContextRegistry('repls', {
        context: require.context('./repls', false, /\.js$/),
      }),
    } = options

    return Helper.attach(host, Repl, {
      lookupProp,
      registryProp,
      registry,
      ...options,
    })
  }
}

export default Repl

export const registerHelper = () => {
  if (Helper.registry.available.indexOf('repl') === -1) {
    Helper.registerHelper('repl', () => Repl)
  }
}

export const commands = Repl.commands
export const runners = Repl.runners
export const extensions = Repl.extensions
export const displays = Repl.displays
export const attach = Repl.attach
