import ModuleManager from './module-manager'

export { ModuleManager }

export function attach(runtime, options = {}) {
  runtime.features.register('module-manager', () => ModuleManager)

  runtime.selectors.register('module/keywords', () => require('./selectors/modules/keywords'))
  runtime.selectors.register('module/maintainers', () => require('./selectors/modules/maintainers'))

  if (runtime.argv.moduleManager !== false) {
    runtime.feature('module-manager').enable(options)
  }
}
