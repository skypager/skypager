import runtime from '@skypager/node'
import * as GoogleIntegration from '../src'

describe('The Google Integration', function() {
  it('is available at runtime.google', function() {
    const serviceAccount = runtime.resolve('secrets', 'serviceAccount.json')

    runtime.use(GoogleIntegration, {
      serviceAccount,
      googleProject: runtime.fsx.readJsonSync(serviceAccount).project_id,
    })

    runtime.should.have.property('google')
  })
})
