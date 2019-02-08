import runtime from '@skypager/web'
import ServerRenderer from './features/server.renderer'

runtime.features.register('react-renderer', () => ServerRenderer)

runtime.feature('react-renderer').enable()

export default runtime
