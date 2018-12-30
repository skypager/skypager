import { Helper } from '@skypager/node'

/**
 * The Sketch Helper is used to work with modules that are created from .sketch files using
 * the sketchtool CLI that comes with SketchApp.  Our wrapper around sketchtool provides an easy
 * way of extracting different slices of data from a .sketch file:
 *
 *  - Pages
 *  - Artboards
 *  - Layers
 *  - Metadata
 *
 * You can see examples in test/fixtures of what sketchtool creates for a given sketch file.
 *
 * An instance of the Sketch class, when running on node, can lazily load any one of these sketchtool views as needed.
 *
 * The only requirements are a path, and that sketchtool is available on your system.
 *
 * To use the Sketch helper in the browser, you will need to provide this data directly in your module.
 * We provide a webpack loader that will do this @skypager/helpers-sketch/sketchtool-loader.js
 * or you can use functions provided by @skypager/helpers-sketch/cli.js
 */
export default class Sketch extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false

  initialState = {
    metadata: {},
  }

  get pageNames() {}

  static attach(runtime, options = {}) {
    Helper.registerHelper('sketch', () => Sketch)

    Helper.attach(runtime, Sketch, {
      registry: Helper.createContextRegistry('sketches', {
        context: Helper.createMockContext(),
      }),
      lookupProp: 'sketch',
      registryProp: 'sketches',
      ...options,
    })

    return runtime
  }
}
