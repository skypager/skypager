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

  describe('Mobx Observable Property Creation', function() {
    it('observable.map', function() {
      const obj = runtime.makeObservable({
        property: [
          'map',
          {
            one: 1,
            two: 2,
          },
        ],
      })

      obj.should.have.property('property').that.is.an('object')

      obj.property.should.have.property('keys')
      obj.property.should.have.property('get')
      obj.property.should.have.property('set')
      obj.property.should.have.property('observe')
      obj.property.should.have.property('toJSON')

      obj.property.toJSON().should.have.property('one', 1)
      obj.property.toJSON().should.have.property('two', 2)
    })
    it('observable.shallowMap', function() {
      const obj = runtime.makeObservable({
        property: [
          'shallowMap',
          {
            one: 1,
            two: 2,
          },
        ],
      })

      obj.should.have.property('property').that.is.an('object')

      obj.property.should.have.property('keys')
      obj.property.should.have.property('get')
      obj.property.should.have.property('set')
      obj.property.should.have.property('observe')
      obj.property.should.have.property('toJSON')
      obj.property.toJSON().should.have.property('one', 1)
      obj.property.toJSON().should.have.property('two', 2)
    })

    it('action', function() {
      function action() {
        this.watchable.set('wow', 'nice')
      }

      const obj = runtime.makeObservable({
        watchable: ['shallowMap', []],
        action: ['action', action],
      })

      obj.action()
      obj.watchable.toJSON().wow.should.equal('nice')
    })

    it('computed', function() {
      const obj = runtime.makeObservable({
        name: 'bob',
        thisIsNice: [
          'computed',
          function() {
            return this.name
          },
        ],
      })
      obj.should.have.property('thisIsNice', 'bob')
    })

    it('object', function() {
      const obj = runtime.makeObservable({
        prop: ['object', { wow: 'nice' }],
      })
      obj.should.have.property('prop').that.is.an('object')
    })
    it('array', function() {
      const obj = runtime.makeObservable({
        list: ['array', [1, 2, 3, 4]],
      })
      obj.should.have.property('list')
      obj.list.should.have.property('toJSON')
    })
    it('shallowArray', function() {
      const obj = runtime.makeObservable({
        list: ['shallowArray', [1, 2, 3, 4]],
      })
      obj.should.have.property('list')
      obj.list.should.have.property('toJSON')
    })

    it('creates observable objects', function() {
      const reaction = sinon.spy()

      let oldValue
      const onChange = change => {
        oldValue = change.oldValue
        reaction()
      }

      const observable = runtime.createObservable(
        {
          nice: 'jon',
          get computedProp() {
            return this.nice
          },
        },
        onChange
      )

      observable.should.have.property('computedProp', 'jon')

      reaction.should.not.have.been.called

      observable.nice = 'not'
      observable.otherProp = 'wow'

      reaction.should.have.been.called
      oldValue && oldValue.should.equal('jon')
      observable.should.have.property('cancelObserver')
    })
  })
})
