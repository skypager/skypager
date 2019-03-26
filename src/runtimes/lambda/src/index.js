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
import * as ClientHelper from '@skypager/helpers-client'
import FsAdapter from '@skypager/node/lib/features/fs-adapter'
import ChildProcessAdapter from '@skypager/node/lib/features/child-process-adapter'
import ScriptRunner from '@skypager/node/lib/features/script-runner'
import * as LambdaRuntimeFeature from './feature'

runtime.use(ClientHelper)

runtime.use({
  attach() {
    runtime.features.register('fs-adapter', () => FsAdapter)
    runtime.features.register('child-process-adapter', () => ChildProcessAdapter)
    runtime.features.register('script-runner', () => ScriptRunner)
    runtime.features.register('runtimes/lambda', () => LambdaRuntimeFeature)

    runtime.use('runtimes/lambda')
  },
})

module.exports = global.skypager = global.skypager || runtime
