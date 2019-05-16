import { Helper, Runtime } from '../src/runtime'

describe('The Helpers System', function() {
  const runtime = new Runtime()
  const spy = require('sinon').spy()

  describe('class based helpers', function() {
    const { Feature } = runtime

    class MyFeature extends Feature {}

    MyFeature.isCacheable = true
    MyFeature.prototype.shortcut = 'myFeature'

    runtime.features.register('my-feature', () => MyFeature)

    it('creates instances of helper subclasses if thats what the registered module provides', function() {
      const myFeature = runtime.feature('my-feature')
      myFeature.enable()

      myFeature.should.be.an.instanceOf(MyFeature)
      myFeature.shortcut.should.equal('myFeature')
      myFeature.runtime.should.have.property('myFeature')
    })
  })

  it('lets you subscribe to registration events for specific helpers', function() {
    runtime.should.have.property('onRegistration').that.is.a('function')
    runtime.onRegistration('someRandomShit', spy)
    spy.should.not.have.been.called

    // this other helper will be registered
    const conceptSpy = require('sinon').spy()
    runtime.onRegistration('concepts', conceptSpy)

    class Story extends Helper {
      static attach(runtime) {
        Helper.attach(runtime, Concept, {
          registry: Helper.createContextRegistry('stories', {
            context: Helper.createMockContext(),
          }),
          lookupProp: 'story',
          registryProp: 'stories',
        })
      }
    }

    class Concept extends Helper {
      static attach(runtime) {
        Helper.attach(runtime, Concept, {
          registry: Helper.createContextRegistry('concepts', {
            context: Helper.createMockContext(),
          }),
          lookupProp: 'concept',
          registryProp: 'concepts',
        })
      }
    }

    runtime.registerHelper('concept', Concept)
    runtime.registerHelper('story', Story)

    // we don't care about stories so far
    runtime.use({ attach: Story.attach })
    conceptSpy.should.not.have.been.called

    // we do care about the concepts
    runtime.use({ attach: Concept.attach })
    conceptSpy.should.have.been.called

    // the runtime should have the concepts and stories registries
    runtime.should.have
      .property('stories')
      .that.is.an('object')
      .with.property('lookup')
      .that.is.a('function')
    runtime.should.have
      .property('concepts')
      .that.is.an('object')
      .with.property('lookup')
      .that.is.a('function')
    runtime.should.have.property('concept').that.is.a('function')
    runtime.should.have.property('story').that.is.a('function')
  })
})
