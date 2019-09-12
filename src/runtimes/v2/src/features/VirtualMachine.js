import Feature from '../Feature'
import vm from 'vm'

/**
 * The VirtalMachine uses node's vm module to allow you to create scripts and contexts
 * (predefined global variables) (as well as modules) from strings of code at runtime.
 *
 * This can be useful if you are writing a test runner (like jest) or if you are providing
 * a code editing environment (like with runnable, live-editable React component examples),
 * or if you have a collection of scripts which you want to provide global context to.
 */
export class VirtualMachine extends Feature {
  /**
   * Registers the VM feature with the runtime
   *
   * @param {import("../Runtime").Runtime} runtime
   * @param {Object} options
   */
  static attach(runtime, options = {}) {
    runtime.features.register('vm', () => VirtualMachine)

    runtime.vm = new VirtualMachine(options, { runtime, ...runtime.context })
    return runtime
  }

  static get vm() {
    return vm
  }

  get vm() {
    return vm
  }

  createScript(fromCode) {
    return this.vm.createScript(fromCode)
  }

  /**
   * @param {import("../Helper").Helper|import("../Runtime").Runtime|Object} fromObject
   */
  createContext(fromObject) {
    if (fromObject.context) {
      fromObject = fromObject.context
    }

    return vm.createContext(fromObject)
  }

  runCode(code, context = {}) {}

  createModule(fromCode, context = {}, options = {}) {}

  /**
   * Returns a function which will run any supplied code in a specified vm context.
   */
  createCodeRunner() {}
}
