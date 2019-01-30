import { Runtime } from 'runtime'
const { sinon } = global

describe('@skypager/runtime observable utils', function() {
  const runtime = new Runtime()

  it('can extend itself with observable properties', function() {
    runtime.makeObservable({
      panicState: 1,
    })

    runtime.should.have.property('panicState')
  })

  it('can create observable objects', function() {
    const spy1 = sinon.spy()
    const initialObject = {
      state: ['shallowMap', []],
    }
    const observable = runtime.createObservable(initialObject, spy1)
    observable.should.have.property('cancelObserver').that.is.a('function')
    observable.should.have.property('state').that.is.an('object')
  })
})
