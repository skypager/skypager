export function attach(runtime, options = {}) {
  runtime = runtime || this

  runtime.selectors.add(require.context('./selectors', true, /\.js$/))
  runtime.features.add(require.context('./features', false, /\.js$/))

  options = runtime.lodash.defaults(
    {},
    options,
    runtime.argv,
    runtime.currentPackage && runtime.currentPackage.skypager,
    runtime.currentPackage,
    runtime.options,
    {
      sourceRoot: process.env.SKYPAGER_SOURCE_ROOT || process.env.SOURCE_ROOT,
    }
  )

  if (!options.sourceRoot || !options.sourceRoot.length) {
    options.sourceRoot = runtime.fsx.existsSync(runtime.resolve('src')) ? 'src' : '.'
  }

  const { sourceRoot } = options

  const baseFolder = runtime.resolve(
    options.baseFolder || options.base || sourceRoot || runtime.cwd
  )

  const fileManagerOptions = {
    ...options,
    sourceRoot,
    baseFolder,
    base: baseFolder,
  }

  const fileManager = runtime.feature('file-manager', fileManagerOptions)

  fileManager.enable(fileManagerOptions)

  // is this necessary
  if (runtime.argv.moduleManager !== false) {
    runtime.feature('module-manager').enable()
  }

  if (runtime.argv.packageManager !== false) {
    runtime.feature('package-manager').enable()
  }

  if (runtime.argv.startFileManager) {
    fileManager
      .startAsync(runtime.argv)
      .then(() => runtime.argv.packageManager && runtime.packageManager.startAsync())
      .then(() => runtime.argv.moduleManager && runtime.moduleManager.startAsync())
      .catch(e => {
        this.runtime.debug('File Manager Failed to Start Automatically', { message: e.message })
      })
  }

  runtime.onRegistration('clients', () => {
    runtime.clients.register('file-manager', () => require('./clients/file-manager'))
    runtime.clients.register('package-manager', () => require('./clients/package-manager'))
  })

  runtime.onRegistration('servers', () => {
    runtime.servers.register('file-manager', () => require('./servers/file-manager'))
    runtime.servers.register('package-manager', () => require('./servers/package-manager'))
  })
}
