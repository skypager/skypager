import runtime from '@skypager/node'
import * as fm from '../src'

describe('The File Manager', function() {
  runtime.use(fm)
  const fileManager = runtime.feature('file-manager')

  before(async function() {
    await fileManager.startAsync()
  })

  it('tells us about the packages inside the project', function() {
    const packages = fileManager.packages.keys()
    packages.should.not.be.empty
  })
})
