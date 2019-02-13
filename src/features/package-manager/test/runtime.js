import runtime from '@skypager/node'
import * as PackageManager from '../src'

runtime.use(PackageManager)

runtime.fileManager.enable()
runtime.feature('package-manager').enable()

runtime.servers.register('package-manager', {
  endpoints: ['package-manager'],
})

export const packageManager = runtime.packageManager

export { runtime }

export default runtime
