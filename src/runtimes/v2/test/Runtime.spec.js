import runtime, { Runtime } from '../src'

describe('Runtime', function() {
  describe('The Singleton', function() {
    it('is always the same instance', function() {
      runtime.uuid.should.equal(require('../src').default.uuid)
    })

    it('can be extended with async middleware in order', async function() {
      const spy = require('sinon').spy()
      runtime
        .use(async function(next) {
          await new Promise(resolve => {
            setTimeout(resolve, 50)
          })
          this.setState({ nice: 80 })
          spy()
          next()
        })
        .use({
          attach() {
            runtime.setState({ wow: 80 })
          },
        })
        .use(async function(next) {
          await new Promise(resolve => {
            setTimeout(resolve, 10)
          })
          this.setState({ nice: 90 })
          next()
        })

      runtime.currentState.wow.should.equal(80)
      spy.should.not.have.been.called
      await runtime.start()
      spy.should.have.been.called
      runtime.currentState.nice.should.equal(90)
    })
  })

  describe('State APIs', function() {
    it('has observable state', function() {
      runtime.should.have.property('currentState')
      runtime.should.have.property('state')
      runtime.should.have.property('setState')
      runtime.should.have.property('observe')
    })
  })
})
