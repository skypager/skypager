import baseRuntime from '@skypager/node'
import * as FileManagerFeature from 'index.js'

describe('The File Manager Feature', function() {
  const runtime = baseRuntime.spawn({ cwd: baseRuntime.cwd })

  before(async function() {
    runtime.use('runtimes/node')

    await runtime.start()
  })

  it('gets registered in the runtime', function() {
    runtime.use(FileManagerFeature).features.available.should.contain('file-manager')
  })

  it('gets enabled automatically once used', function() {
    runtime.has('fileManager').should.equal(true)
  })

  it('starts off without any knowledge of files or directories', function() {
    runtime.should.have.property('fileIds').that.is.empty
    runtime.should.have.property('directoryIds').that.is.empty
  })

  it('can be started', async function() {
    await runtime.fileManager.startAsync()
    runtime.fileManager.should.have.property('status', 'READY')
  })

  it('has file and directory data after it is started', function() {
    runtime.fileManager.should.have.property('status', 'READY')
    runtime.fileManager.fileIds.should.be.an('array').that.is.not.empty
    runtime.fileManager.directoryIds.should.be.an('array').that.is.not.empty
  })

  it('can match files using a route pattern', function() {
    const matches = runtime.fileManager.matchRoute('src/features/:name.js')
    matches.should.be.an('array').that.is.not.empty
    matches[0].should.be
      .an('object')
      .with.property('result')
      .that.is.an('object')
      .that.has.property('name').that.is.not.empty
  })
})
