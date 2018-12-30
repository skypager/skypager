import runtime, { Helper } from '@skypager/node'

export default class Sketch extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false

  static attach(host = runtime, options = {}) {
    Helper.registerHelper('sketch', () => Sketch)

    Helper.attach(host, Sketch, {
      registry: Helper.createContextRegistry('sketches', {
        context: Helper.createMockContext(),
      }),
      lookupProp: 'sketch',
      registryProp: 'sketches',
      ...options,
    })

    return host
  }

  static async listPages() {}

  static async findSketchBin() {
    const result = await runtime.select('process/output', {
      cmd: 'which sketchtool',
    })

    if (result && result.length) {
      return result[0]
    }
  }
}
