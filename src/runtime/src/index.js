import '@babel/polyfill/noConflict'
import { Runtime, createSingleton, Feature, Helper } from './runtime'

export { Runtime, Helper, Feature }

/**
 * @type {Runtime}
 */
const runtime = createSingleton()

export default runtime
