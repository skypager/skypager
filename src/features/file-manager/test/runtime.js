import host from '@skypager/node'
import * as FileManagerFeature from '../src'
import * as ServerHelper from '@skypager/helpers-server'

const runtime = host
  .spawn({
    cwd: host.cwd,
  })
  .use('runtimes/node')

runtime.use(ServerHelper).use(FileManagerFeature)

runtime.servers.register('file-manager', {
  endpoints: ['file-manager'],
})

runtime.feature('file-manager').enable()
runtime.feature('package-manager').enable()

const { fileManager, packageManager } = runtime

export { packageManager, fileManager, runtime }

export default runtime
