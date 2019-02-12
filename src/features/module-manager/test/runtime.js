import runtime from '@skypager/node'
import * as ModuleManager from '../src'

runtime.use(ModuleManager)

runtime.fileManager.enable()
runtime.feature('module-manager').enable()

export const moduleManager = runtime.moduleManager

export { runtime }

export default runtime
