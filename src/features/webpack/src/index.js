import runtime, { Feature } from '@skypager/node'
import webpack from 'webpack'
import configMerge from 'webpack-merge'

runtime.features.register('webpack', () => WebpackFeature)

/**
 * The Browser VM Feature provides a JSDOM sandbox that lets you use the runtime.vm as if it was really inside a browser.
 *
 * This lets you run browser scripts in node, for testing, server rendering, whatever.
 *
 * @export
 * @class BrowserVmFeature
 * @extends {Feature}
 */
export default class WebpackFeature extends Feature {
  static isCacheable = false
  static isObservable = true
  static allowAnonymousProviders = true

  initialState = {
    progress: 0,
    stage: 'Created',
  }

  createCompiler(config) {
    const compiler = webpack(config)

    compiler.runAsync = options =>
      new Promise((resolve, reject) =>
        compiler.run(options, (err, stats) => (err ? reject(err) : resolve(stats)))
      )

    return compiler
  }
}
