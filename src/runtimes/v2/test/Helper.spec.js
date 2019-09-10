import Runtime from '../src/Runtime'
import Helper, { types } from '../src/Helper'

class Book extends Helper {
  static providerTypes = {
    author: types.string,
  }

  static initialState = {
    copies: 10,
  }

  static optionTypes = {
    format: types.string.isRequired,
  }
}

const runtime = new Runtime().use(Book)

runtime.books.register('1984', () => ({
  author: 'George Orwell',
}))

describe('Helper', function() {
  describe('State APIs', function() {
    it('can have initial state set on the class prototype', function() {
      const book = runtime.book('1984')
      book.currentState.copies.should.equal(10)
    })
    it('can have initial state set through options', function() {
      const book = runtime.book('1984', { initialState: { copies: 0 } })
      book.should.have
        .property('currentState')
        .that.is.an('object')
        .that.has.property('copies', 0)
    })
    it('emits state change events', function() {
      const book = runtime.book('1984', { initialState: { copies: 0 } })
      const spy = require('sinon').spy()
      book.on('stateDidChange', spy)
      book.setState(current => ({
        ...current,
        copies: current.copies + 1,
      }))
      spy.should.have.been.called
    })
  })
})
