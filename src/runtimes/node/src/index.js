const skypager = require('@skypager/runtime')
const initializer = require('./initializer')

const { resolve } = skypager.pathUtils
const { defaultsDeep } = skypager.lodash

defaultsDeep(process, {
  env: {
    SKYPAGER_PACKAGE_CACHE_ROOT: resolve(__dirname, '..', '.cache', 'skypager'),
  },
})

skypager.features.register('runtimes/node', () => require('./feature'))

skypager.use(initializer)

module.exports = skypager

skypager.hide('runtimeProvider', 'node', true)
skypager.hide('runtimeModule', module.id, true)
skypager.hide('runtimePackageInfo', __PACKAGE__, true) // eslint-disable-line
