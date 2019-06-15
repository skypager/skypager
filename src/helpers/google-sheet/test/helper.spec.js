import runtime from '@skypager/node'
import * as SheetHelper from '../src'

runtime.use(SheetHelper, {
  serviceAccount: runtime.resolve('secrets', 'serviceAccount.json'),
  googleProject: runtime.fsx.readJsonSync(runtime.resolve('secrets', 'serviceAccount.json'))
    .project_id,
})

describe('The Sheets Helper', function() {
  it('attaches a sheets registry to the runtime', function() {
    runtime.should.have
      .property('sheets')
      .that.is.an('object')
      .with.property('discover')
      .that.is.a('function')
  })

  it('attaches a factory function for creating a sheet helper instance', function() {
    runtime.should.have.property('sheet').that.is.a('function')
  })

  it('discovers available sheets from google drive', async function() {
    await runtime.sheets.discover()
    runtime.sheets.should.have.property('available').that.is.an('array').that.is.not.empty
  })

  it('exposes a RowEntity class', function() {
    runtime
      .sheet(runtime.sheets.available[0])
      .should.have.property('RowEntity')
      .that.is.a('function')
  })

  it('can be registered with a google sheet id', async function() {
    const sheetId = runtime.sheets.allInstances()[0].provider.id
    runtime.sheets.register('mySheet', {
      sheetId,
    })

    const sheet = runtime.sheet('mySheet')
    sheet.sheetId.should.equal(sheetId)
  })

  it('can use an initializer function', async function() {
    const sheetId = runtime.sheets.allInstances()[0].provider.id
    runtime.sheets.register('myOtherSheet', {
      sheetId,
      initialize: async () => {
        runtime.setState({ sheetIsReady: 'yayuh' })
      },
    })

    const sheet = await runtime.sheet('myOtherSheet')
    runtime.currentState.should.have.property('sheetIsReady', 'yayuh')
  })
})
