import runtime from '@skypager/node'
import * as FileManagerFeature from '../src'

runtime.use(FileManagerFeature)
runtime.feature('file-manager').enable()
runtime.feature('package-manager').enable()

const { fileManager, packageManager } = runtime

export { packageManager, fileManager, runtime }

export default runtime
