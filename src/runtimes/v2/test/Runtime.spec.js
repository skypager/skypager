import runtime, { Runtime } from '../src'

describe('Runtime', function() {
  describe('The Singleton', function() {
    it('is always the same instance', function() {
      runtime.uuid.should.equal(require('../src').default.uuid)
    })

    it('can be extended immediately', function() {
      runtime.use({
        attach(h) {
          h.wow = 1
        },
      })
      runtime.wow.should.equal(1)
    })

    it('can be extended with async middleware in order when started', async function() {
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

  describe('centralized logger', function() {
    it('should use whatever console you give it', function() {
      const sinon = require('sinon')

      const mock = {
        log: sinon.spy(),
        info: sinon.spy(),
        warn: sinon.spy(),
        debug: sinon.spy(),
        error: sinon.spy(),
      }

      const runtime = new Runtime({ logging: { level: 'debug', console: mock } })

      runtime.info('INFO')
      runtime.debug('DEBUG')
      runtime.error('ERROR')
      runtime.warn('WARN')

      mock.info.should.have.been.called
      mock.debug.should.have.been.called
      mock.error.should.have.been.called
      mock.warn.should.have.been.called
    })

    it('should share the same logger between helpers and the runtime', function() {
      const mock = { info: require('sinon').spy() }
      const runtime = new Runtime({ logging: { console: mock } })

      runtime.features.register('loggable', () => ({}))
      const loggable = runtime.feature('loggable')

      loggable.info('wow')
      runtime.info('nice')

      mock.info.should.have.been.calledTwice
    })
  })
})
