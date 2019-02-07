import runtime, { Feature } from '@skypager/runtime'
import { JSDOM } from 'jsdom'

runtime.features.register('browser-vm', () => BrowserVmFeature)

export function attach(runtime, options = {}) {
  /**
   * @type {BrowserVmFeature}
   */
  runtime.browserVm = runtime.feature('browser-vm')
  runtime.browserVm.enable(options)
}

export default class BrowserVmFeature extends Feature {
  runScript(code, options = {}) {
    const { runtime } = this
    const { context = this.createBrowserContext(options) } = options

    try {
      const result = runtime.vm.createScript(code).runInContext(context)

      return {
        result,
        code,
        context,
      }
    } catch (error) {
      return {
        error,
        code,
        context,
      }
    }
  }

  createMockDOM(options = {}) {
    const { domContent = '', domOptions = {} } = options

    const mock = new JSDOM(domContent, {
      pretendToBeVisual: true,
      url: `https://localhost`,
      ...domOptions,
    })

    return mock
  }

  createBrowserContext(options = {}) {
    const { runtime } = this
    const { entries } = this.lodash

    const mock = this.createMockDOM(options)

    const sandbox = mock.window

    sandbox.global = mock.window

    if (options.mockConsole !== false) {
      sandbox.console = mockConsole()
    }

    entries(options.context || {}).forEach(([key, value]) => {
      sandbox[key] = value
    })

    const vmSandbox = runtime.vm.createContext(sandbox)

    return vmSandbox
  }
}

const consoleFunctions = [
  'debug',
  'error',
  'info',
  'log',
  'warn',
  'dir',
  'dirxml',
  'table',
  'trace',
  'group',
  'groupCollapsed',
  'groupEnd',
  'clear',
  'count',
  'countReset',
  'assert',
  'markTimeline',
  'profile',
  'profileEnd',
  'timeline',
  'timelineEnd',
  'time',
  'timeEnd',
  'timeStamp',
  'context',
  'memory',
]

const mockConsole = () =>
  consoleFunctions.reduce(
    (memo, name) => ({
      ...memo,
      [name]: () => true,
    }),
    {}
  )
