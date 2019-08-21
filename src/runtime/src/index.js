import '@babel/polyfill/noConflict'
import { Runtime, createSingleton, Feature, Helper } from './runtime'

export { Runtime, Helper, Feature }

export default createSingleton()
