import { Runtime } from '../src/runtime'
import { types, Helper } from '../src/helper'

describe('prop type validation', function() {
  class Validator extends Helper {
    static isCacheable = false
    static allowAnonymousProviders = true

    static optionTypes = {
      logic: types.string.isRequired,
    }

    static providerTypes = {
      wow: types.func.isRequired,
    }

    static contextTypes = {
      nice: types.arrayOf(types.number).isRequired,
    }

    static attach(runtime) {
      Helper.attach(runtime, Validator, {
        registry: Helper.createContextRegistry('validators', {
          context: Helper.createMockContext(),
        }),
        lookupProp: 'validator',
        registryProp: 'validators',
      })
    }
  }

  const runtime = new Runtime().use(Validator)

  runtime.validators.register('wow', () => ({
    nope: () => 1,
  }))

  it('can validate option types', function() {
    const wow = runtime.validator('wow')
    const result = wow.checkTypes('options')
    result.should.be.an('object').that.has.property('pass', false)
    result.should.have
      .property('result')
      .that.is.a('string')
      .that.matches(/logic.*Validator.*undefined/)

    const ok = runtime.validator('wow', { logic: 'Nice' })
    ok.uuid.should.not.equal(wow.uuid)

    ok.checkTypes('options').should.have.property('pass', true)
  })

  it('can validate provider types', function() {
    const wow = runtime.validator('wow')
    const result = wow.checkTypes('provider')
    result.should.be.an('object').that.has.property('pass', false)
    result.should.have
      .property('result')
      .that.is.a('string')
      .that.matches(/wow.*Validator.*undefined/)

    runtime.validators.register('pass', () => ({ wow: () => 1 }))

    const ok = runtime.validator('pass')

    ok.checkTypes('provider').should.have.property('pass', true)
  })

  it('can validate context types', function() {
    const wow = runtime.validator('wow')
    const yo = wow.checkTypes('context')

    wow.contextTypes.should.have.property('nice')

    yo.should.have.property('pass', false, 'wow should not have the right context')

    const ok = runtime.validator('context-ok', {
      getChildContext: () => ({ nice: [69] }),
    })

    const result = ok.checkTypes('context')

    result.should.have.property('pass', true)
  })
})
