// import * as autoDiscovery from './auto-discovery.js'
import childProcessAdapter from './child-process-adapter.js'
import * as featureFinder from './feature-finder.js'
import * as fileDownloader from './file-downloader.js'
import * as fsAdapter from './fs-adapter.js'
import * as git from './git.js'
import * as homeDirectory from './home-directory.js'
import * as logging from './logging.js'
import * as mainScript from './main-script.js'
import * as matcher from './matcher.js'
import * as networking from './networking.js'
import * as opener from './opener.js'
import * as osAdapter from './os-adapter.js'
import * as packageCache from './package-cache.js'
import * as packageFinder from './package-finder.js'
import * as scriptRunner from './script-runner.js'
import * as skywalker from './skywalker.js'
import * as socket from './socket.js'

export function attach(runtime) {
  // runtime.features.register('auto-discovery', () => autoDiscovery)
  runtime.features.register('child-process-adapter', () => childProcessAdapter)
  runtime.features.register('feature-finder', () => featureFinder)
  runtime.features.register('file-downloader', () => fileDownloader)
  runtime.features.register('fs-adapter', () => fsAdapter)
  runtime.features.register('git', () => git)
  runtime.features.register('home-directory', () => homeDirectory)
  runtime.features.register('logging', () => logging)
  runtime.features.register('main-script', () => mainScript)
  runtime.features.register('matcher', () => matcher)
  runtime.features.register('networking', () => networking)
  runtime.features.register('opener', () => opener)
  runtime.features.register('os-adapter', () => osAdapter)
  runtime.features.register('package-cache', () => packageCache)
  runtime.features.register('package-finder', () => packageFinder)
  runtime.features.register('script-runner', () => scriptRunner)
  runtime.features.register('skywalker', () => skywalker)
  runtime.features.register('socket', () => socket)
}
