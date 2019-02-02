describe('The File Downloader Feature', function() {
  const runtime = require('../../src/index.js')

  it('is available', function() {
    runtime.features.checkKey('file-downloader').should.equal('file-downloader')
  })

  it('is defined as a class', function() {
    runtime.feature('file-downloader').provider.should.have.property('default')
  })

  it('gets created as an instance of the FileDownloaderFeature class', function() {
    runtime.feature('file-downloader').constructor.name.should.equal('FileDownloaderFeature')
  })

  it('has methods for downloading files', function() {
    runtime
      .feature('file-downloader')
      .should.have.property('download')
      .that.is.a('function')
    runtime
      .feature('file-downloader')
      .should.have.property('downloadAsync')
      .that.is.a('function')
  })
})
