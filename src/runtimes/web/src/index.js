import skypager from '@skypager/runtime'

if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

if (typeof process === 'undefined') {
  global.process = { env: {} }
}

skypager.features.add(require.context('./features', true, /\.js$/))

module.exports = skypager
  .use(pageHelper)
  .use(clientHelper)
  .use('asset-loaders')

/*
  .use("history")
  .use("navigation")
  .use("routing")
  */

skypager.hide('runtimeProvider', 'web', true)
skypager.hide('runtimeModule', module.id, true)
skypager.hide('runtimePackageInfo', __PACKAGE__, true)

if (!global.skypager) {
  global.skypager = skypager
}
