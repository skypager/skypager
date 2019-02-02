import runtime from '@skypager/runtime'
import * as features from './features' // eslint-disable-line
import * as NodeFeature from './feature'

runtime.features.register('runtimes/node', () => NodeFeature)

runtime.feature('runtimes/node').enable()

/**
 * @typedef NodeRuntime
 * @property {GitFeature} git interact with git
 * @property {FileSystemFeature} fsx interact with a file system
 *
 */

/**
 * @type NodeRuntime - @skypager/runtime with the node feature set enabled
 */
module.exports = runtime
