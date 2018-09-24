import { packageManager, fileManager } from './runtime'

describe('The File Manager', function() {
  before(async function() {
    await fileManager.startAsync()
    await packageManager.startAsync()
  })

  it('tells us about the files inside the project', function() {
    fileManager.fileIds.should.not.be.empty
  })

  it('tells us about the files inside the project', function() {
    fileManager.fileObjects.should.not.be.empty
  })

  it('tells us about the packages inside the project', function() {
    const packages = fileManager.packages.keys()
    packages.should.not.be.empty
  })
})
