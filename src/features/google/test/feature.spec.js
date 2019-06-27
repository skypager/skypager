import runtime from '@skypager/node'
import * as GoogleIntegration from '../src'

describe('The Google Integration', function() {
  const serviceAccount = runtime.resolve('secrets', 'serviceAccount.json')

  runtime.use(GoogleIntegration, {
    serviceAccount,
    googleProject: runtime.fsx.readJsonSync(serviceAccount).project_id,
  })

  it('is available at runtime.google', function() {
    runtime.should.have.property('google')
  })

  it('is enabled as a feature', function() {
    runtime.features.checkKey('google').should.equal('google')
    runtime.isFeatureEnabled('google').should.equal(true)
  })

  it('provides access to the drive api', async function() {
    const drive = await runtime.google.drive

    drive.should.be
      .an('object')
      .with.property('files')
      .that.is.an('object')
      .that.has.property('list')
      .that.is.a('function')
  })

  it('has state', function() {
    runtime.google.should.have.property('state')
    runtime.google.state.should.have.property('toJSON')
    runtime.google.should.have.property('currentState')
  })

  it('has settings', function() {
    runtime.google.should.have.property('settings').that.is.an('object')

    runtime.google.settings.should.have.property('serviceAccount').that.is.a('string')
    runtime.google.settings.should.have.property('googleProject').that.is.a('string')
    runtime.google.settings.should.have.property('scopes').that.is.an('array')
  })

  it('has versions', function() {
    runtime.google.should.have.property('versions').that.is.an('object')
    runtime.google.serviceVersion('drive').should.equal('v2')
  })
})
