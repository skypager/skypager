import Registry from '../src/Registry'

describe('Registry', function() {
  describe('events', function() {
    const registry = new Registry()

    it('accepts promises', async function() {
      const spy = require('sinon').spy()
      registry.register('nice', async function() {
        spy()
        return { nice: 99 }
      })
      registry.get('nice').should.be.a('function')
      spy.should.not.have.been.called
      const result = await registry.request('nice')
      result.should.be.an('object')
      spy.should.have.been.called
    })

    it('tells us what is available', function() {
      registry.register('mine', () => ({ nice: 1 }))
      registry.register('theirs', () => ({ nice: 1 }))

      registry.available.should.include('mine')
      registry.available.should.include('theirs')
    })

    it('throws an error when an invalid member is requested', function() {
      let errorMessage = ''
      try {
        registry.request('unavailable')
      } catch (error) {
        errorMessage = error.message
      }

      errorMessage.should.include('available')
    })

    it('lets me update metadata', function() {
      expect(registry.meta('nice')).to.be.empty
      registry.meta('nice', { nice: 1 })
      registry
        .meta('nice')
        .should.be.an('object')
        .with.property('nice', 1)
    })

    it('emits events when a member is loaded', function() {
      const spy = require('sinon').spy()
      const registry = new Registry()

      registry.register('my-module', () => {
        return {
          yo: 1,
        }
      })

      registry.once('loaded', spy)

      spy.should.not.have.been.called

      registry.request('my-module')

      spy.should.have.been.calledWith('my-module')
    })
  })
})
