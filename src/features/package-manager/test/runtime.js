import runtime from '@skypager/node'
import * as PackageManager from '../src'

runtime.use(PackageManager)

runtime.fileManager.enable()
runtime.feature('package-manager').enable()

export const packageManager = runtime.packageManager

export { runtime }

export default runtime
