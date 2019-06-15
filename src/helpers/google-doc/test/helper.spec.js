import runtime from '@skypager/node'
import * as GoogleDocHelper from '../src'

describe('The Google Documents Helper', function() {
  before(function() {
    runtime.use(GoogleDocHelper, {
      serviceAccount: runtime.resolve('secrets', 'serviceAccount.json'),
      googleProject: runtime.fsx.readJsonSync(runtime.resolve('secrets', 'serviceAccount.json'))
        .project_id,
    })
  })

  it('attaches a googleDocs registry to the runtime', function() {
    runtime.should.have
      .property('googleDocs')
      .that.is.an('object')
      .with.property('discover')
      .that.is.a('function')
  })

  it('attaches a factory function for creating a sheet helper instance', function() {
    runtime.should.have.property('googleDoc').that.is.a('function')
  })

  it('discovers available sheets from google drive', async function() {
    await runtime.googleDocs.discover()
    runtime.googleDocs.should.have.property('available').that.is.an('array').that.is.not.empty
  })

  it('creates an instance of the helper', async function() {
    const googleDoc = runtime.googleDoc('skypagerTestDocument')
    googleDoc.should.have.property('title').that.is.not.empty
    await googleDoc.load()
    googleDoc.should.have.property('paragraphNodes').that.is.an('array').that.is.not.empty
    googleDoc.should.have.property('lists').that.is.not.empty
    googleDoc.should.have.property('tableNodes').that.is.not.empty
  })

  it('can use an initializer function', async function() {
    const docId = runtime.googleDoc('skypagerTestDocument').documentId

    runtime.googleDocs.register('myDoc', {
      documentId: docId,
    })

    const googleDoc = await runtime.googleDoc('myDoc', {
      initialize: async () => {
        runtime.setState({ docsIsReady: 'yesYesYall' })
      },
    })

    runtime.currentState.should.have.property('docsIsReady', 'yesYesYall')
  })
})
