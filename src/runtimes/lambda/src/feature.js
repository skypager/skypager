export const hostMethods = ['parseArgv']

export function featureWasEnabled(...args) {
  try {
    enabledHook.call(this, ...args)
  } catch (error) {
    console.error('Error enabling node runtime')
    console.error(error.message)
    console.log(error.stack)
  }
}

export function enabledHook(options = {}) {
  const { runtime } = this
  const { get, omit, defaultsDeep } = runtime.lodash

  defaultsDeep(runtime.argv, runtime.parseArgv(runtime.argv))

  runtime.feature('profiler').enable()
  runtime.invoke('profiler.profileStart', 'lambdaRuntimeEnabled')

  /**
   * @instance
   * @property fsx
   * @type FsxInterface
   */
  runtime.feature('fs-adapter').enable()

  runtime.lazy(
    'proc',
    () => {
      const procFeature = runtime.feature('child-process-adapter')
      procFeature.enable()
      return procFeature
    },
    true
  )

  runtime.lazy('currentPackage', () =>
    runtime.fsx.readJsonSync(
      runtime.currentState.currentPackagePath || runtime.resolve('package.json')
    )
  )

  const currentPackagePath = runtime.fsx.findUpSync('package.json')
  runtime.state.set('currentPackagePath', currentPackagePath)

  runtime.setState({ lambdaFeatureEnabled: true })
  runtime.emit('lambdaFeatureEnabled')
}

export function parseArgv(base = {}) {
  const { snakeCase, camelCase } = this.stringUtils
  const { defaultsDeep, omitBy, mapKeys } = this.lodash

  const procArgs = require('minimist')(process.argv.slice(2))

  return omitBy(
    defaultsDeep(
      {},
      base,
      procArgs,
      { _: [] },
      mapKeys(procArgs, (v, k) => camelCase(snakeCase(k)))
    ),
    (v, k) => !k || k.length === 0 || k.match(/^\w+\-\w+/)
  )
}
