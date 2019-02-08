import runtime from '@skypager/node'
import ServerRenderer from './features/server.renderer'
import * as BrowserVm from '@skypager/features-browser-vm'

runtime.features.register('react-renderer', () => ServerRenderer)

runtime.feature('react-renderer').enable()
runtime.use(BrowserVm)

export default runtime
