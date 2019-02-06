if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

const skypager = require('@skypager/runtime').use(require('@skypager/helpers-client'))

skypager.features.register('asset-loaders', () => require('./features/asset-loaders'))
skypager.features.register('babel', () => require('./features/babel'))
skypager.features.register('window-messaging', () => require('./features/window-messaging'))

module.exports = skypager.use('asset-loaders')

skypager.hide('runtimeProvider', 'web', true)
skypager.hide('runtimeModule', module.id, true)

if (typeof __PACKAGE__ !== 'undefined') {
  // eslint-disable-next-line
  skypager.hide('runtimePackageInfo', __PACKAGE__, true)
}
