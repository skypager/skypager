import runtime from '@skypager/runtime'
import * as DocumentHelper from '../src'

describe('The Document Helper', function() {
  before(function() {
    runtime.use(DocumentHelper)
  })

  it('should create a registry of markdown documents', function() {
    runtime.should.have.property('mdxDocs')
  })

  it('should create a registry of babel documents', function() {
    runtime.should.have.property('scripts')
  })
})
