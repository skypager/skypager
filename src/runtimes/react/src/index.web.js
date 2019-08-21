import runtime from '@skypager/web'
import * as DomRenderer from './features/dom.renderer'
import * as hooks from './hooks' 

runtime.features.register('react-renderer', () => DomRenderer)

const renderer = runtime.feature('react-renderer')

renderer.enable()

export { hooks, renderer }

runtime.hooks = hooks

export default runtime
