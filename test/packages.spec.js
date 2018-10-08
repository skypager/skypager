describe('The Skypager Packages', function() {
  before(async function() {
    const skypager = require('@skypager/node')
    await skypager.fileManager.startAsync()
    await skypager.packageManager.startAsync()
  })

  it('finds all of the packages', function() {
    const { packageData = [] } = skypager.packageManager
    const packageNames = packageData.map(pkg => pkg.name)

    packageNames.should.not.be.empty
    packageNames.should.include('@skypager/node')
    packageNames.should.include('@skypager/web')
    packageNames.should.include('@skypager/cli')
    packageNames.should.include('@skypager/devtools')
    packageNames.should.include('@skypager/webpack')
    packageNames.should.include('@skypager/helpers-server')
    packageNames.should.include('@skypager/helpers-repl')
    packageNames.should.include('@skypager/helpers-client')
    packageNames.should.include('@skypager/features-file-manager')
  })

  it('enforces valid naming', function() {
    const { packageData = [] } = skypager.packageManager
    packageData.filter(pkg => !pkg.name.match(/test-package/)).forEach(pkg => {
      pkg.name.should.match(/^@?skypager/)
    })
  })

  it('enforces valid package.json scripts config', function() {
    const { packageData = [] } = skypager.packageManager

    packageData.length.should.be.greaterThan(16)
    packageData
      .filter(pkg => pkg.name !== '@skypager/portfolio' && !pkg.name === '@skypager/devtools')
      .forEach(pkg => {
        if (!pkg.scripts || !pkg.scripts.build || !pkg.scripts.prepare) {
          throw new Error(`${pkg.name} does not have the required scripts`)
        }
      })
  })
})
