describe('The User Home Directory Adapter', function() {
  const runtime = require('../../src/index.js')

  it('maps the local skypager folder in the users home directory', function() {
    const { homeFolder } = runtime
    homeFolder.path.should.match(/.skypager/)
    homeFolder.join('nice').should.match(/.skypager\/nice/)
  })
})
