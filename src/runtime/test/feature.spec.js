import { Runtime, Helper } from 'runtime'
import { Feature } from 'helpers/feature'

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

    runtime.feature('some-feature').should.be.instanceOf(Feature)
    runtime.feature('some-feature').featureMethods.should.include('a', 'b')
  })

  it('can be created anonymously', function() {
    const anon = runtime.feature('anonymous', {
      featureMethods: ['a'],
    })

    anon.should.be.instanceOf(Feature)
    anon.name.should.equal('anonymous')
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
    const runtimeExtension = runtime.feature('runtime-extension', {
      hostMethods: ['runtimeExtendedMethod'],
      runtimeExtendedMethod() {
        return this.uuid
      },
    })

    runtimeExtension.hostMethods.should.include('runtimeExtendedMethod')
    runtimeExtension.hostMixin.should.have.property('runtimeExtendedMethod').that.is.a('function')
  })

  it('enables with a promise', async function() {
    const asyncFeature = runtime.feature('async-feature', {
      featureWasEnabled() {
        return new Promise(resolve => setTimeout(resolve, 400)).then(
          () => (asyncFeature.finally = true)
        )
      },
    })

    const p = runtime.feature('profiler')

    p.enable()

    p.start('enableAsync')
    await asyncFeature.enable()
    p.end('enableAsync')

    asyncFeature.finally.should.equal(true)
    p.report.enableAsync.duration.should.be.greaterThan(400)
  })

  it('enables with a callback', function(done) {
    const cbStyle = runtime.feature('callback-feature', {
      featureWasEnabled() {
        this.done = true
      },
    })

    cbStyle.enable(() => {
      cbStyle.done.should.equal(true)
      done()
    })
  })
})
