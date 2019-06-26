import runtime from '@skypager/node'
import * as GoogleIntegration from '../src'

describe('The Google Integration', function() {
  it('is available at runtime.google', function() {
    runtime.use(GoogleIntegration)
    runtime.should.have.property('google')
  })
})
