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

    it('builds metadata', async function() {
      await sketch.build()
      sketch.isBuilt.should.equal(true)
    })

    it('builds a list of pages', function() {
      sketch.should.have.property('pages').that.is.not.empty
      sketch.pages[0].should.have.property('name')
    })

    it('builds a list of artboards', function() {
      sketch.should.have.property('artboards').that.is.not.empty
      sketch.artboards[0].should.have.property('category')
    })

    xit('builds a list of layers', function() {
      sketch.should.have.property('layers').that.is.not.empty
      sketch.layers[0].should.have.property('category')
      sketch.layers[0].should.have.property('layers')
      sketch.layers[0].should.have.property('children')
    })

    it('tells us the page names found', function() {
      sketch.should.have.property('pageNames').that.includes('Home', 'Products', 'ProductDetails')
    })

    it('tells us the artboard categories', function() {
      sketch.should.have.property('artboardCategories').that.includes('Desktop')
    })
  })
})
