import { Helper, Runtime } from 'runtime'

describe('The Helpers System', function() {
  const runtime = new Runtime()
  const spy = require('sinon').spy()

  it('lets you subscribe to registration events for specific helpers', function() {
    runtime.should.have.property('onRegistration').that.is.a('function')
    runtime.onRegistration('someRandomShit', spy)
    spy.should.not.have.been.called
    // features will already exist so it gets called immediately
    runtime.onRegistration('features', spy)
    spy.should.have.been.called

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
