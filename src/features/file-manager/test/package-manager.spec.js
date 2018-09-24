import { packageManager, fileManager } from './runtime'

describe('The Package Manager', function() {
  before(async function() {
    await packageManager.startAsync()
  })

  it('tells us about the manifests in the project', function() {
    packageManager.manifests.keys().should.include('package.json')
    packageManager.manifests.keys().should.include('test/fixtures/test-package/package.json')
  })

  it('has a map of packages found by name', function() {
    packageManager.byName.should.be
      .an('object')
      .that.has.property('@skypager/features-file-manager')
  })

  it('can find packages by name', function() {
    packageManager
      .findByName('test-package')
      .should.be.an('object')
      .with.property('name', 'test-package')
  })

  it('can find packages by their dependencies', function() {
    packageManager.findDependentsOf('test-package').should.have.property('test-package-2')
  })

  it('maps packages by their dependencies', function() {
    packageManager.dependenciesMap.should.be.an('object').that.is.not.empty
  })

  it('can find a package using a function', function() {
    packageManager.findBy(v => false).should.be.empty
    packageManager.findBy(v => true).should.not.be.empty
  })
})
