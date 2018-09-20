describe('Servers', function() {
  const { skypager: runtime } = global
  let fileManager

  before(function() {
    fileManager = runtime.feature('file-manager')
    fileManager.enable()
  })

  it('registers the file manager server if the server helper is in use', function() {
    runtime.use(require('@skypager/helpers-server'))
    runtime.should.have
      .property('servers')
      .that.has.property('available')
      .that.is.an('array')
      .that.includes('file-manager')
  })
})
