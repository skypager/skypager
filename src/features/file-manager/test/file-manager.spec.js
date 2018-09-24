import runtime from './runtime'

describe('The File Manager', function() {
  before(async function() {
    await runtime.fileManager.startAsync({
      packages: true,
    })
  })

  it('tells us about the files inside the project', function() {
    runtime.fileManager.fileIds.should.not.be.empty
  })

  it('tells us about the files inside the project', function() {
    runtime.fileManager.fileObjects.should.not.be.empty
  })

  it('tells us about the packages inside the project', function() {
    runtime.fileManager.packages.should.not.be.empty
  })
})
