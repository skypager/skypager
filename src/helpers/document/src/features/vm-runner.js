import { Feature } from '@skypager/runtime'

export default class VmRunner extends Feature {
  static isCacheable = false
  static isObservable = true

  initialState = {
    errors: [],
    success: false,
    ran: false,
    running: false,
  }

  beforeInitialize() {
    const { runtime } = this

    if (
      !runtime.isFeatureEnabled('module-factory') &&
      runtime.features.checkKey('module-factory')
    ) {
      runtime.feature('module-factory').enable()
    }

    this.lazy('vmContext', () => this.options.vmContext || this.createVmContext(this.options))
  }

  createVmContext(options = {}) {
    const sandbox = this.tryGet('sandbox', {})
    const filename = this.tryGet('filename', 'script.js')

    const vmContext = this.runtime.vm.createContext({
      ...sandbox,
      require: this.tryGet(
        'requireFunction',
        this.runtime.moduleFactory.createRequireFunction(filename)
      ),
      console,
      ...options.sandbox || {},
    })

    return vmContext
  }

  get identifiers() {
    return this.tryGet('identifiers', [])
  }

  get code() {
    return this.tryGet('content', '')
  }

  get parsed() {
    return this.tryGet('parsed', [])
  }

  get importStatements() {
    return this.parsed.filter(p => p.type === 'ImportDeclaration')
  }

  get program() {
    return this.parsed.filter(p => p.type !== 'ImportDeclaration')
  }

  get errors() {
    return this.currentState.errors || []
  }

  get results() {
    return this.program
      .filter(instruction => instruction.inspectable)
      .map(instruction => ({
        id: instruction.id,
        index: instruction.index,
        result: instruction.result,
      }))
  }

  async run(options = {}) {
    const { get } = this.lodash
    const { runtime } = this
    const { importStatements = [], program = [], vmContext: context } = this

    this.state.merge({ running: true, ran: false, success: false, errors: [] })
    
    Object.keys(options).forEach(key => (context[key] = context[key] || options[key]))


    if (global.regeneratorRuntime || (runtime.isBrowser && window.regeneratorRuntime)) {
      context.regeneratorRuntime =
        global.regeneratorRuntime || (runtime.isBrowser && window.regeneratorRuntime)
    }

    if (options.global !== false && !context.global) {
      Object.defineProperty(context, 'global', {
        get: () => context,
      })
    }

    if (options.polyfill !== false) {
      runtime.vm.createScript(`require("@babel/polyfill")`).runInContext(context)
    }

    importStatements.forEach(instruction => {
      const { varName, transpiled, accessors = [], identifiers = [] } = instruction
      const script = runtime.vm.createScript(transpiled)

      try {
        script.runInContext(context)

        const lib = context[varName]

        identifiers.forEach((name, i) => {
          context[name] = get(lib, accessors[i])
        })
      } catch (error) {
        instruction.error = error
      }
    })

    let encounteredError

    for (let instruction of program) {
      if (encounteredError) {
        break;
      }
      
      const script = runtime.vm.createScript(instruction.transpiled)

      let result

      try {
        result = script.runInContext(context)
      } catch (error) {
        instruction.error = error
      }

      if (instruction.inspectable && !instruction.error) {
        try {
          result = await result
          instruction.result = result

          if (instruction.type === 'VariableDeclaration') {
            instruction.result = instruction.identifiers.map(id => context[id])
          }
        } catch (error) {
          instruction.error = error
        }
      }
    }

    const errors = this.parsed.filter(p => p.error).map(r => ({ id: r.id, error: r.error }))

    this.state.merge({
      running: false,
      ran: true,
      success: !errors.length,
      errors,
    })

    return this
  }
}
