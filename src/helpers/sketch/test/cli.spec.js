const cli = require('../src/cli')
const runtime = require('@skypager/node')

describe('Sketchtool CLI Wrapper', function() {
  const fixturePath = runtime.resolve('test', 'fixtures', 'WebApplication.sketch')

  it('can load metadata from a sketch file', async function() {
    const metadata = await cli.viewSketchMetadata(fixturePath)
    metadata.should.have.property('pagesAndArtboards')
  })

  it('can read layer info from the sketchfile', async function() {
    const layers = await cli.listSketchLayers(fixturePath)
    layers.should.have.property('pages')
    layers.pages[0].should.have.property('layers')
  })

  it('can read artboard info from the sketchfile', async function() {
    const pages = await cli.listSketchArtboards(fixturePath)
    pages.should.have.property('pages')
    pages.pages[0].should.have.property('artboards')
  })

  it('can read page info from the sketchfile', async function() {
    const pages = await cli.listSketchPages(fixturePath)
    pages.should.have.property('pages')
    pages.pages[0].should.have.property('name', 'Home')
  })

  it('can read a whole dump of the sketchfile', async function() {
    const dump = await cli.viewSketchDump(fixturePath)
    dump.should.be.an('object').that.is.not.empty
  })
})
