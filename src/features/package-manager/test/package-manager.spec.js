import { runtime } from './runtime'

describe('The Package Manager', function() {
  let packageManager

  before(async function() {
    await runtime.fileManager.startAsync()
    packageManager = runtime.feature('package-manager')
    packageManager.enable()
  })

  it('shares a file manager with runtime', function() {
    runtime.fileManager.uuid.should.equal(packageManager.fileManager.uuid)
    runtime.fileManager.status.should.equal(packageManager.fileManager.status)
  })

  it('has test fixtures', function() {
    runtime.fileManager.fileIds.should.include('test/fixtures/test-package-2/package.json')
  })

  it('has a lifecyle', async function() {
    packageManager.status.should.equal('CREATED')
    await packageManager.startAsync()
    packageManager.status.should.equal('READY')
  })

  it('finds packages', function() {
    packageManager.packageNames.should.include('@skypager/features-package-manager')
    packageManager.packageNames.should.include('test-package-2')
  })

  it('should not fail to load any', function() {
    packageManager.failed.should.be.empty
  })

  it('can find a package by its name', function() {
    packageManager
      .findByName('@skypager/features-package-manager')
      .should.be.an('object')
      .with.property('name', '@skypager/features-package-manager')
    packageManager
      .findByName('test-package-2')
      .should.be.an('object')
      .with.property('name', 'test-package-2')
  })

  it('can check the remote status of packages', async function() {
    packageManager.should.have.property('checkRemoteStatus').that.is.a('function')
    packageManager.should.have.property('remotes')
    packageManager.remotes.should.have.property('get')
    packageManager.remotes.should.have.property('set')
    packageManager.remotes.should.have.property('keys')
  })

  it('has a map of the current packages and their versions', function() {
    const { versionMap } = packageManager

    versionMap.should.have.property('test-package-2')
    versionMap.should.have.property('test-package')
    versionMap.should.have.property(
      '@skypager/features-package-manager',
      packageManager.runtime.currentPackage.version
    )
  })
})
