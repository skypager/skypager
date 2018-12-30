import runtime from '@skypager/node'
import Sketch from '../src'

describe('Companion Server / Client Helper', function() {
  before(function() {
    !runtime.has('sketches') && runtime.use(Sketch)
  })

  it('can find the sketch tool', async function() {
    const bin = await Sketch.findSketchBin()
    bin.should.be.a('string').that.matches(/sketchtool/)
  })
})
