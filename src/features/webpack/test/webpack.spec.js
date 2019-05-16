import runtime from '@skypager/node'
import '../src'

describe('The Webpack Feature', function() {
  it('gets registered', function() {
    runtime.features.checkKey('webpack').should.not.equal(false)
  })
})
