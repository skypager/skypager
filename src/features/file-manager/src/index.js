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

  runtime.feature('file-manager', fileManagerOptions).enable(fileManagerOptions)

  if (runtime.commands) {
    runtime.commands.register('fileManager', () => require('./commands/fileManager'))
  }

  if (runtime.argv.moduleManager !== false) {
    runtime.feature('module-manager').enable()
  }

  if (runtime.argv.packageManager !== false) {
    runtime.feature('package-manager').enable()
  }

  if (runtime.argv.startFileManager) {
    runtime.fileManager
      .startAsync(runtime.argv)
      .then(() => runtime.argv.packageManager && runtime.packageManager.startAsync())
      .then(() => runtime.argv.moduleManager && runtime.moduleManager.startAsync())
      .catch(e => {
        this.runtime.debug('File Manager Failed to Start Automatically', { message: e.message })
      })
  }
}
