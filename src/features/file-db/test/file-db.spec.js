import runtime from '@skypager/node'
import * as fileDb from '../src'

runtime.use(fileDb)

describe('The File Database', function() {
  it('can be enabled', function() {
    runtime.feature('file-db').enable()
    runtime.should.have.property('fileDb')
  })
})
