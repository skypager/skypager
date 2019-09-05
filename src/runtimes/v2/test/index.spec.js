import runtime, { createHelper, types, Runtime, Helper, Feature, Registry } from '../src'

describe('Top Level API', function() {
  it('exports a singleton Runtime instance as its default export', function() {
    runtime.should.be.an('object').with.property('context')
    runtime.should.have.property('use').that.is.a('function')
  })

  it('exposes a function for creating instances of any Helper class in the context of the current runtime singleton', function() {
    createHelper.should.be.a('function')
  })
  it('exposes the prop-types library for defining optionTypes, providerTypes, contextTypes on your Helper', function() {
    types.should.have.property('runtime')
    types.should.have.property('shape')
    types.should.have.property('string')
  })
  it('exposes the core Runtime, Helper, Feature, Registry classes', function() {
    Runtime.should.be.a('function')
    Helper.should.be.a('function')
    Registry.should.be.a('function')
    Feature.should.be.a('function')
  })
})
