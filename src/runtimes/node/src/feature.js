import runtime from '@skypager/runtime'
import * as features from './features'

runtime.use(features)

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

  /* 
    these are flags that help me test these modules.  when this env is set
    i am usually running untranspiled src code, and don't want the node runtime to
    load the transpiled version first
 */
  const {
    disableHelpers = process.env.DISABLE_SKYPAGER_HELPERS || '',
    disableFileManager = !!process.env.DISABLE_SKYPAGER_FILE_MANAGER,
    disablePackageManager = !!process.env.DISABLE_SKYPAGER_PACKAGE_MANAGER,
    disableModuleManager = !!process.env.DISABLE_SKYPAGER_MODULE_MANAGER,
  } = runtime.argv

  if (runtime.argv.profile) {
    runtime.feature('profiler').enable()
  }

  runtime.lazy('cli', () => require('./cli').default)
  runtime.invoke('profiler.profileStart', 'nodeRuntimeEnabled')

  /*
  if (disableHelpers.match(/command/i)) {
    runtime.invoke('profiler.profileStart', 'helperCommandEnabled')
    runtime.use(require('skypager-helpers-command'), 'INITIALIZING')
    runtime.invoke('profiler.profileEnd', 'helperCommandEnabled')
  }
  */

  runtime.invoke('profiler.profileStart', 'osAdaptersEnabled')
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

  runtime.lazy(
    'os',
    () => {
      const osFeature = runtime.feature('os-adapter')
      osFeature.enable()
      return osFeature
    },
    true
  )

  runtime.lazy(
    'networking',
    () => {
      const netFeature = runtime.feature('networking')
      netFeature.enable()
      return netFeature
    },
    true
  )

  runtime.invoke('profiler.profileEnd', 'osAdaptersEnabled')

  runtime.feature('logging').enable()
  runtime.lazy('logging', () => runtime.feature('logging'), true)

  runtime.lazy(
    'opener',
    () => {
      const opener = runtime.feature('opener')
      opener.enable()
      return opener
    },
    true
  )

  runtime.hide(
    '_argv_paths',
    runtime.helperTags.map(tag => ['currentPackage', 'skypager', ...tag.split('/')])
  )

  const packageConfig = runtime.get('currentPackage.skypager', {})

  const { env, target } = runtime

  const targetConfig = defaultsDeep({}, get(packageConfig, [env]), get(packageConfig, [target]))

  runtime.hide('projectConfig', defaultsDeep({}, targetConfig, omit(packageConfig, target, env)))

  defaultsDeep(runtime.argv, runtime.parseArgv(runtime.argv), runtime.projectConfig)

  /*
  runtime.lazy(
    'homeFolder',
    () => {
      const homeDirectory = runtime.feature('home-directory')
      homeDirectory.enable()
      return runtime.homeFolder
    },
    true
  )
  */

  runtime.lazy(
    'skywalker',
    () => {
      const skywalker = runtime.feature('skywalker')
      skywalker.enable()
      return skywalker
    },
    true
  )

  runtime.invoke('profiler.profileStart', 'packageFinderEnabled')
  runtime.feature('package-finder').enable()
  runtime.invoke('profiler.profileEnd', 'packageFinderEnabled')

  runtime.invoke('profiler.profileStart', 'findCurrentPackage')
  runtime.packageFinder
    .findNearest()
    .then(currentPackagePath => {
      runtime.state.set('currentPackagePath', currentPackagePath)
      runtime.invoke('profiler.profileEnd', 'findCurrentPackage')
    })
    .catch(error => {
      runtime.state.set('packageFinderError', error)
      // swallow the erro
    })

  runtime.lazy('packageCache', () => {
    runtime.feature('package-cache').enable()
    return runtime.packageCache
  })

  runtime.lazy('fileDownloader', () => {
    const downloader = runtime.feature('file-downloader')
    downloader.enable()
    return downloader
  })

  if (!disableFileManager) {
    runtime.lazy('fileManager', () => {
      try {
        runtime.invoke('profiler.profileStart', 'fileManagerEnabled')
        require('@skypager/features-file-manager').attach(runtime, {
          disableModuleManager,
          disablePackageManager,
        })
        runtime.invoke('profiler.profileEnd', 'fileManagerEnabled')
        return runtime.feature('file-manager')
      } catch (e) {
        console.error(`Error attaching file manager`, e.message, e.stack)
        return e
      }
    })
  }

  runtime.selectors.register('helpers/discover', () => require('./selectors/helpers/discover'))
  runtime.selectors.register('process/output', () => require('./selectors/process/output'))
  runtime.selectors.register('process/result', () => require('./selectors/process/result'))

  const mainScript = runtime.feature('main-script')

  mainScript.enable()

  runtime.getter('mainScript', () => mainScript)

  const attached = {}

  runtime.hideGetter('attachedHelpers', () => attached)

  const lazyAttach = (baseName, fn) => {
    runtime.setState(({ lazyAttached = [] }) => ({
      lazyAttached: lazyAttached.concat([baseName]),
    }))

    runtime.invoke('profiler.profileStart', `lazyAttached_${baseName}`)
    runtime.lazy(baseName, () => {
      if (attached[baseName]) {
        return runtime[baseName]
      }

      fn()
      runtime.invoke('profiler.profileEnd', `lazyAttached_${baseName}`)
      attached[baseName] = true

      return runtime[baseName]
    })

    runtime.lazy(`${baseName}s`, () => {
      if (attached[baseName]) {
        return runtime[`${baseName}s`]
      }

      fn()
      attached[baseName] = true

      return runtime[`${baseName}s`]
    })
  }

  if (!disableHelpers.match(/client/)) {
    lazyAttach('client', () => {
      runtime.invoke('profiler.profileStart', 'clientHelperEnabled')
      runtime.use(require('@skypager/helpers-client'), 'INITIALIZING')
      runtime.invoke('profiler.profileEnd', 'clientHelperEnabled')
    })
  }

  if (!disableHelpers.match(/repl/)) {
    lazyAttach('repl', () => {
      runtime.invoke('profiler.profileStart', 'replHelperEnabled')
      runtime.use(require('@skypager/helpers-repl'), 'INITIALIZING')
      runtime.invoke('profiler.profileEnd', 'replHelperEnabled')
    })
  }

  if (!disableHelpers.match(/server/)) {
    lazyAttach('server', () => {
      runtime.invoke('profiler.profileStart', 'serverHelperEnabled')
      runtime.use(require('@skypager/helpers-server'))
      runtime.invoke('profiler.profileEnd', 'serverHelperEnabled')
    })
  }

  const requestedFeatures = runtime.chain
    .plant(runtime.lodash.castArray(runtime.argv.use))
    .intersection(runtime.features.available)
    .without(Object.keys(runtime.enabledFeatures))
    .value()

  if (requestedFeatures.length) {
    runtime.debug('Enabling features requested via command line', { requestedFeatures })

    requestedFeatures.forEach(featureId => {
      const result = runtime.lodash.attempt(() => runtime.feature(featureId).enable(runtime.argv))

      if (runtime.lodash.isError(result)) {
        runtime.error(`Error while enabling requested feature`, {
          featureId,
          message: result.message,
        })
      }
    })
  }

  if (!runtime.state.get('mainScriptRan')) {
    runtime.invoke('profiler.profileStart', 'mainScriptRunner')
    runtime.mainScript
      .runMainScript()
      .then(() => {
        runtime.setState({ mainScriptRan: true })
        runtime.invoke('profiler.profileEnd', 'mainScriptRunner')
      })
      .catch(err => {
        runtime.error(`Error running mainScript`, { error: err.message })
        runtime.setState({ mainScriptError: err })
        runtime.invoke('profiler.profileEnd', 'mainScriptRunner')

        if (runtime.argv.safeMode) {
          console.error(`Error while running skypager main script. ${err.message}`)
          process.exit(1)
        }
      })
  }

  if (runtime.argv.profile) {
    runtime.profiler.profileEnd('nodeRuntimeEnabled')
  }

  runtime.setState({ nodeFeatureEnabled: true })
  runtime.emit('nodeFeatureEnabled')
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
