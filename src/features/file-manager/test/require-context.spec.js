import runtime from './runtime'

describe('The File Manager', function() {
  before(async function() {
    await runtime.fileManager.startAsync({
      packages: true,
    })
  })

  it('enables the runtime to create webpack require contexts', function() {
    runtime.should.have.property('requireContext').that.is.a('function')
    const req = runtime.requireContext(/package.json$/, {
      keyBy: 'relative',
      requireFn: location => runtime.fsx.readJsonSync(location),
    })

    req.keys().should.not.be.empty
    req('package.json').should.have.property('name', '@skypager/features-file-manager')
  })
})
