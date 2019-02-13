import { attach as attachPackageManager } from '@skypager/features-package-manager'
import { attach as attachModuleManager } from '@skypager/features-module-manager'

export function attach(runtime, options = {}) {
  runtime = runtime || this

  runtime.features.register('file-manager', () => require('./file-manager'))

  runtime.selectors.register('files/cache', () => require('./selectors/files/cache'))
  runtime.selectors.register('files/changed', () => require('./selectors/files/changed'))
  runtime.selectors.register('files/extensions', () => require('./selectors/files/extensions'))
  runtime.selectors.register('files/mimeTypes', () => require('./selectors/files/mimeTypes'))
  runtime.selectors.register('files/tree', () => require('./selectors/files/tree'))

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

  const { disableModuleManager, disablePackageManager, sourceRoot } = options

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

  if (!disablePackageManager) {
    runtime.use({ attach: attachPackageManager })
    runtime.feature('package-manager').enable(fileManagerOptions)
  }

  if (!disableModuleManager) {
    runtime.use({ attach: attachModuleManager })
    runtime.feature('module-manager').enable(fileManagerOptions)
  }

  fileManager.enable(fileManagerOptions)

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
  })

  runtime.onRegistration('servers', () => {
    runtime.endpoints.register('file-manager', () => require('./endpoints/file-manager'))
  })
}
