describe('The Package Finder', function() {
  const runtime = require('../../src/index')
  const { packageFinder } = runtime

  it('is available on the runtime', function() {
    runtime.should.have
      .property('packageFinder')
      .which.is.an('object')
      .that.has.property('attemptResolve')
      .that.is.a('function')
  })

  it('will attempt to resolve a package', function() {
    packageFinder.attemptResolve('not_gon_find_it').should.equal(false)
    packageFinder.attemptResolve('@skypager/node').should.be.a('string')
  })

  it('provides access to the semver package as a utility', function() {
    packageFinder.should.have.property('semver')
    packageFinder.semver.should.have.property('gt').that.is.a('function')
    packageFinder.semver.should.have.property('lt').that.is.a('function')
  })

  it('finds the nearest package.json', async function() {
    const nearest = await packageFinder.findNearest()
    nearest.should.equal(runtime.resolve('package.json'))
  })

  it('finds packages above the current one', async function() {
    const parent = await packageFinder.findParentPackage()
    parent.should.not.equal(runtime.resolve('package.json'))
  })

  it('tells us the current module info', function() {
    packageFinder.should.have.property('currentModule')
    packageFinder.should.have
      .property('currentModulePaths')
      .that.is.an('array')
      .that.includes(runtime.join('node_modules'))
  })

  it('gives us all the cached module ids', function() {
    packageFinder.should.have.property('cachedModuleIds').that.is.an('array').that.is.not.empty
  })

  it('finds package locations', async function() {
    const packageStores = await packageFinder.findPackageLocations({
      moduleFolderName: 'node_modules',
    })

    packageStores.should.be.an('array').that.is.not.empty
  })

  describe('finder method', function() {
    it('finds scoped packages', async function() {
      const skypagerPackages = await packageFinder.find(/@skypager\/helpers-.*/)
      const names = skypagerPackages.map(fullPath => runtime.pathUtils.basename(fullPath))

      names.should.include('helpers-repl')
      names.should.include('helpers-client')
      names.should.include('helpers-sheet')
      names.should.include('helpers-server')
    })

    it('can find package using a regex', async function() {
      const packages = await packageFinder.find(/babel/)
      packages.filter(v =>
        v
          .split('/')
          .pop()
          .match(/babel/)
      ).should.not.be.empty
    })
    it('can find package using a string', async function() {
      const packages = await packageFinder.find('babel')
      packages.filter(v =>
        v
          .split('/')
          .pop()
          .match(/babel/)
      ).should.not.be.empty
    })
    it('can find packages using a function', async function() {
      const packages = await packageFinder.find(path => path.match(/babel/))
      packages.should.not.be.empty
    })
    it('can find package using an array of rules', async function() {
      const packages = await packageFinder.find([/babel/, /eslint/])
      packages.should.not.be.empty
    })
  })
})
