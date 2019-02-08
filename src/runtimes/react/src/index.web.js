import runtime from '@skypager/web'
import * as DomRenderer from './features/dom.renderer'

runtime.features.register('react-renderer', () => DomRenderer)

const renderer = runtime.feature('react-renderer')

renderer.enable()

export { renderer }

export default runtime
