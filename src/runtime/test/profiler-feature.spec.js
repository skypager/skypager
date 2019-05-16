import { Runtime } from '../src/runtime'
const { sinon } = global

describe('The Profiling Feature', function() {
  const runtime = new Runtime()
  const profiler = runtime.feature('profiler')

  it('has observable timings', function() {
    profiler.should.have
      .property('timings')
      .that.is.an('object')
      .that.has.property('set')
  })

  it('lets me profile things', async function() {
    profiler.start('startTest')
    await new Promise(resolve => setTimeout(resolve, 50))
    profiler.end('startTest')
    profiler.report.startTest.duration.should.be.greaterThan(48)
  })
})
