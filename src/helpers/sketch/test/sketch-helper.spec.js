import runtime from '@skypager/node'
import Sketch from '../src'

describe('Sketch Helper', function() {
  const fixturePath = runtime.resolve('test', 'fixtures', 'WebApplication.sketch')
  let sketch

  it('can be attached', function() {
    Sketch.should.have.property('attach').that.is.a('function')
    Sketch.attach(runtime)
    runtime.helpers.available.should.include('sketch')
    sketch = runtime.sketch('WebApplication', {
      path: fixturePath,
    })
  })

  it('creates a registry of sketch documents on the runtime', function() {
    runtime.should.have
      .property('sketches')
      .that.has.property('register')
      .that.is.a('function')
    runtime.should.have
      .property('sketches')
      .that.has.property('lookup')
      .that.is.a('function')
  })

  it('creates a sketch helper factory function on the runtime', function() {
    runtime.should.have.property('sketch').that.is.a('function')
  })

  describe('Creating instances directly via the JavaScript API', function() {
    it('needs a path', function() {
      sketch.should.have.property('path', fixturePath)
    })
  })
})
