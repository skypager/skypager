describe('Memory FileSystem', function() {
  const { skypager: runtime } = global
  let fileManager

  before(function() {
    fileManager = runtime.feature('file-manager', { session: 'memfs-test' })
    fileManager.enable()
    // runtime.hide('fileManager', fileManager)
  })

  it('exposes methods for creating an in memory file system', function() {
    fileManager.should.have.property('syncMemoryFileSystem').that.is.a('function')
  })

  it('creates a memory file system', function() {
    const memFs = fileManager.memoryFileSystem
    const readMethods = ['readFile', 'readdir', 'exists', 'stat']
    readMethods.forEach(fn => {
      memFs.should.be
        .an('object')
        .that.has.property(fn)
        .that.is.a('function')
    })
  })

  it('creates an fsx style interface ontop of the memory file system', async function() {
    const memFs = await fileManager.syncMemoryFileSystem(fileManager, {
      fallback: true,
      content: true,
    })
    const content = memFs.readFileSync(runtime.resolve('src', 'index.js')).toString()
    content.should.be.a('string').that.is.not.empty
    fileManager.runtime.should.have
      .property('fsm')
      .that.is.an('object')
      .that.has.property('readFile')
      .that.is.a('function')
  })

  it('does not load git ignored content by default', async function() {
    const memFs = await fileManager.syncMemoryFileSystem({ fallback: true, content: true })
    const files = await memFs.readdirSync(runtime.cwd)
    files.should.not.include('lib')
    memFs.readdirSync(runtime.resolve('lib')).should.not.be.empty
  })

  it('is only in your head', async function() {
    const mockPath = runtime.resolve('all-an-illusion.txt')
    const memFs = await fileManager.syncMemoryFileSystem({ fallback: true, content: true })

    await memFs.writeFileAsync(mockPath, 'they trickin ya')

    const content = await memFs.readFileAsync(mockPath).then(buf => buf.toString())

    content.should.include('trickin ya')

    const areYouSerious = await fileManager.runtime.fsx.existsAsync(mockPath)

    areYouSerious.should.not.equal(true)
  })
})
