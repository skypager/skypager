if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

if (typeof process === 'undefined') {
  global.process = { env: {} }
} else {
  global.process = process
}

const skypager = (global.skypager = global.runtime = require('@skypager/runtime').use(
  require('@skypager/helpers-client')
))

skypager.features.add(require.context('./features', true, /\.js$/))

module.exports = skypager.use('asset-loaders')

skypager.hide('runtimeProvider', 'web', true)
skypager.hide('runtimeModule', module.id, true)

if (typeof __PACKAGE__ !== 'undefined') {
  skypager.hide('runtimePackageInfo', __PACKAGE__, true)
}

if (!global.skypager) {
  global.skypager = skypager
}
