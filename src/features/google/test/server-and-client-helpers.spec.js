import runtime from '@skypager/node'
import * as SheetHelper from '../src'

describe('Companion Server / Client Helper', function() {
  before(function() {
    !runtime.has('sheets') &&
      runtime.use(SheetHelper, {
        serviceAccount: runtime.resolve('secrets', 'serviceAccount.json'),
        googleProject: runtime.fsx.readJsonSync(runtime.resolve('secrets', 'serviceAccount.json'))
          .project_id,
      })
  })

  it('provides a rest server', function() {
    runtime.servers.available.should.include('sheets')
  })

  it('provides a client server', function() {
    runtime.clients.available.should.include('sheets')
  })
})
