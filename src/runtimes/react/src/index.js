import runtime from '@skypager/runtime'
import ServerRenderer from './features/server.renderer'
import * as BrowserVm from '@skypager/features-browser-vm'
import * as hooks from './hooks'

runtime.features.register('react-renderer', () => ServerRenderer)

const renderer = runtime.feature('react-renderer')

export { renderer, hooks } 

export function attach(runtime, options = {}) {
  runtime.use(BrowserVm, options)
  renderer.enable(options)
}

runtime.hooks = hooks

export default runtime.use({ attach })
