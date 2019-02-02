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
      debugThisShit: true,
      runtimeExtendedMethod() {
        return this.uuid
      },
    })

    runtimeExtension.hostMethods.should.include('runtimeExtendedMethod')
    runtimeExtension.hostMixin.should.have.property('runtimeExtendedMethod').that.is.a('function')
  })
})
