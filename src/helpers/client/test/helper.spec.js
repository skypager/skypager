import runtime from '@skypager/runtime'
import * as ClientHelper from '../src'

describe('The Client Helper', function() {
  before(function() {
    runtime.use(ClientHelper)
  })

  it('registers as a helper', function() {
    runtime.helpers.available.should.include('client')
  })

  it('attachs a clients registry to the runtime', function() {
    runtime.should.have
      .property('clients')
      .that.is.an('object')
      .that.has.property('available')
      .that.is.an('array').that.is.empty
  })

  it('attaches a factory function for creating client helper instances', function() {
    runtime.should.have.property('client').that.is.a('function')
  })

  it('can register client helper providers', function() {
    runtime.clients.register('myClient', () => ({
      methods: ['getGetterMethod', 'helperFunction'],
      getGetterMethod() {
        return 'nice'
      },
      helperFunction() {
        return 'helper'
      },
    }))

    runtime.clients.checkKey('myClient').should.equal('myClient')
  })

  it('has an axios instance', function() {
    const client = runtime.client('myClient')
    client.should.have.property('client')
    client.client.should.have.property('get').that.is.a('function')
    client.client.should.have.property('post').that.is.a('function')
    client.client.should.have.property('put').that.is.a('function')
    client.client.should.have.property('delete').that.is.a('function')
    client.client.should.have.property('patch').that.is.a('function')
  })

  it('creates an interface for the helper', function() {
    const client = runtime.client('myClient')
    client.should.have.property('getterMethod', 'nice')
    client.should.have.property('helperFunction').that.is.a('function')
    client.helperFunction().should.equal('helper')
  })
})
