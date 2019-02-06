/**
 * @namespace nodeRuntime
 * @module @skypager/node
 * @description require the @skypager/node module to get access to the skypager node runtime
 */
/**
 * @typedef Runtime
 * @property {Function} start
 * @property {Object} features
 * @property {Function} feature
 */
/**
 * @type {Runtime}
 */
import runtime from '@skypager/runtime'
import * as NodeFeature from './feature'

runtime.features.register('runtimes/node', () => NodeFeature)

runtime.feature('runtimes/node').enable()

try {
  runtime.feature('git').enable()
  runtime.setState({ gitInitialized: typeof runtime.git !== 'undefined' })
} catch (error) {
  console.log('error enabling git feature')
}

/**
 * @typedef NodeRuntime
 * @property {GitFeature} git interact with git
 * @property {FileSystemFeature} fsx interact with a file system
 * @property {ChildProcessAdapter} proc interact with child processes
 * @property {PackageCacheFeature} packageCache interact with a cache store for selectors
 * @property {OpenerFeature} opener open files and urls on the local machine
 * @property {MainScriptFeature} mainScript interact with project specific main script for setup and customization
 */

/**
 * @type {NodeRuntime}
 * @extends Runtime
 */
module.exports = runtime
