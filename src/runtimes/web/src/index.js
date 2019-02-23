import runtime, { Runtime } from '@skypager/runtime'
import * as ClientHelper from '@skypager/helpers-client'
import AssetLoaders from './features/asset-loaders'
import Babel from './features/babel'
import * as WindowMessaging from './features/window-messaging'

const webRuntime = runtime

webRuntime.features.register('asset-loaders', () => AssetLoaders)
webRuntime.features.register('babel', () => Babel)
webRuntime.features.register('window-messaging', WindowMessaging)

webRuntime
  /**
   * The @skypager/web runtime bundles the ClientHelper which lets build REST clients using the axios library.
   */
  .use(ClientHelper)
  /**
   * The asset loaders feature is enabled by default
   */
  .use('asset-loaders')

/**
 * @typedef {Object} WebRuntime
 * @property {Function} client
 */
export default webRuntime
