import { Runtime } from 'runtime'

describe('@skypager/runtime', function() {
  it('creates new instances of runtime', function() {
    const runtimeOne = new Runtime()
    const runtimeTwo = new Runtime()

    runtimeOne.uuid.should.not.equal(runtimeTwo.uuid)
  })
})
