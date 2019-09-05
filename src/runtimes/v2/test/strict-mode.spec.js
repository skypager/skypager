import { types, Runtime, Helper } from '../src'

export class Concept extends Helper {
  static strictMode = true

  static optionTypes = {
    stage: types.string.isRequired,
  }

  static providerTypes = {
    checkApproval: types.func.isRequired,
  }

  static contextTypes = {
    runtime: types.runtime.isRequired,
  }
}

export class Idea extends Helper {
  static strictMode = false

  static optionTypes = {
    stage: types.string.isRequired,
  }

  static providerTypes = {
    checkApproval: types.func.isRequired,
  }

  static contextTypes = {
    runtime: types.runtime.isRequired,
  }
}

const runtime = new Runtime().use(Concept).use(Idea)

runtime.ideas.register('wow', () => ({
  crazy: true,
}))

runtime.concepts.register('valid', () => ({
  checkApproval: () => true,
}))

runtime.concepts.register('invalid', () => ({
  checkApproval: false,
}))

describe('Non-strict Helper Mode', function() {
  it('should recognize that invalid options were provided', function() {
    const someIdea = runtime.idea('wow', { funds: 0 })
    someIdea.checkTypes('options').pass.should.equal(false)
  })

  it('should recognize that invalid provider attributes were provided', function() {
    const idea = runtime.idea('wow')
    idea.checkTypes('provider').pass.should.equal(false)
  })
})

describe('Strict Helper Mode', function() {
  it('should work with valid options', function() {
    const concept = runtime.concept('valid', {
      stage: 'paper napkin',
    })

    concept.should.be.an('object')
  })

  it('should throw an error on invalid provider when in strict mode', function() {
    try {
      runtime.concept('invalid', {
        stage: 'paper napkin',
      })
    } catch (error) {
      error.message.should.match(/invalid provider.*checkApproval/i)
    }
  })

  it('should throw error on invalid options when in strict mode', function() {
    let threw = false

    try {
      const concept = runtime.concept('valid', {
        stage: true,
      })
    } catch (error) {
      threw = error
    }

    threw.should.have.property('message').that.matches(/invalid options.*boolean.*expected/i)
  })
})
