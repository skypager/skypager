import { moduleManager } from './runtime'

describe('The Module Manager', function() {
  before(async function() {
    await moduleManager.runtime.fileManager.startAsync()
  })

  it('exists', function() {
    moduleManager.should.be.an('object')
    moduleManager.should.have.property('startAsync')
    moduleManager.should.have.property('runtime')
  })

  it('has a lifecycle', async function() {
    moduleManager.status.should.equal('CREATED')
    await moduleManager.startAsync()
    moduleManager.status.should.equal('READY')
  })

  it('finds all of our node modules', function() {
    moduleManager.packageNames.should.include('@babel/core')
    moduleManager.packageNames.should.include('@skypager/node')
    moduleManager.packageNames.should.include('@skypager/features-file-manager')
  })

  xit('can check the repository for info about a package', async function() {
    const babelCoreInfo = await moduleManager.checkRepo('@babel/core', 'latest')
    babelCoreInfo.should.be.an('object')
    babelCoreInfo.maintainers.should.be
      .an('array')
      .that.includes('loganfsmyth <loganfsmyth@gmail.com>')
  })
})
