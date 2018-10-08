mocha.setup('bdd')
mocha.setup({ timeout: 30000 })
chai.should() // eslint-disable-line

describe('Skypager Runtime', function() {
  const { skypager } = global

  it('is available in the global namespace', function() {
    skypager.should.be.an('object')
  })

  it('provides a vm', async function() {
    skypager.should.have.property('vm').that.is.an('object')
    skypager.vm.should.have.property('createContext').that.is.a('function')
    const runner = skypager.createCodeRunner('typeof window')
    const { result } = await runner()
    result.should.equal('object')
  })

  it('has a limited set of features available by default', function() {
    skypager.features.available.should.include('vm')
  })

  it('should detect that it is in a browser', function() {
    skypager.should.have.property('isBrowser', true)
    skypager.should.have.property('isNode', false)
  })

  it('should report its cwd', function() {
    skypager.cwd.should.equal('/')
  })

  it('should provide string utils', function() {
    skypager.stringUtils.should.be
      .an('object')
      .with.property('kebabCase')
      .that.is.a('function')
  })
})

mocha.run()
