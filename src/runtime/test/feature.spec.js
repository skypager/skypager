import { Runtime, Helper } from '../src/runtime'
import { Feature } from '../src/feature'

describe('The Feature Helper', function() {
  const runtime = new Runtime()

  it('is a subclass of Helper', function() {
    runtime.feature('vm').should.be.instanceOf(Feature)
    runtime.feature('vm').should.be.instanceOf(Helper)
  })

  it('can be registered and then created', function() {
    runtime.features.register('some-feature', () => ({
      featureMethods: ['a', 'b'],
    }))

    runtime.features.available.should.include('some-feature')

    runtime.feature('some-feature').should.be.instanceOf(Feature)
    runtime.feature('some-feature').featureMethods.should.include('a', 'b')
  })

  it('can not be created anonymously', function() {
    let threw
    try {
      runtime.feature('anonymous', {
        featureMethods: ['a'],
      })
    } catch (error) {
      threw = true
    }

    threw.should.equal(true)
  })

  it('can be enabled', async function() {
    let enabled = false

    runtime.features.register('enableThis', () => ({
      featureWasEnabled() {
        enabled = true
      },
    }))

    runtime.enabledFeatureIds.should.not.include('enableThis')
    enabled.should.equal(false)
    await runtime.feature('enableThis').enable()
    enabled.should.equal(true)
  })

  it('can extend the runtime', async function() {
    runtime.features.register('runtime-extension', {
      hostMethods: ['runtimeExtendedMethod'],
      runtimeExtendedMethod() {
        return this.uuid
      },
    })

    const runtimeExtension = runtime.feature('runtime-extension')

    runtimeExtension.hostMethods.should.include('runtimeExtendedMethod')
    runtimeExtension.hostMixin.should.have.property('runtimeExtendedMethod').that.is.a('function')
  })

  it('enables with a promise', async function() {
    runtime.features.register('async-feature', {
      featureWasEnabled() {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => (this.finally = true))
      },
    })

    const asyncFeature = runtime.feature('async-feature')
    const p = runtime.feature('profiler')

    p.enable()

    p.start('enableAsync')
    await asyncFeature.enable()
    p.end('enableAsync')

    asyncFeature.finally.should.equal(true)
    p.report.enableAsync.duration.should.be.greaterThan(300)
  })

  it('enables with a callback', function(done) {
    runtime.features.register('callback-feature', () => ({
      featureWasEnabled() {
        this.done = true
      },
    }))

    const cbStyle = runtime.feature('callback-feature')

    cbStyle.enable(() => {
      cbStyle.done.should.equal(true)
      done()
    })
  })

  it('can be registered and enabled as a middleware', async function() {
    const runtime = new Runtime()

    class MiddlewareFeature extends Feature {
      static featureId = 'middleware-feature'
      featureWasEnabled() {
        return true
      }
    }

    MiddlewareFeature.should.have.property('isSkypagerFeature', true)
    MiddlewareFeature.should.have.property('featureId', 'middleware-feature')
    MiddlewareFeature.should.have.property('isSkypagerHelper', true)
    runtime.use(MiddlewareFeature)
    runtime.features.available.should.include('middleware-feature')
    await runtime.start()

    runtime.enabledFeatureIds.should.include('middleware-feature')
  })
})
