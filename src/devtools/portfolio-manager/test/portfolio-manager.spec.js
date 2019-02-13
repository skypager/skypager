import runtime from '@skypager/node'
import * as PortfolioManager from '../src'

runtime.use(PortfolioManager)

describe('The Portfolio Manager', function() {
  it('is available at portfolio', function() {
    runtime.should.have.property('portfolio')
  })

  it('has access to various managers', function() {
    runtime.portfolio.should.have.property('packageManager')
    runtime.portfolio.should.have.property('fileManager')
    runtime.portfolio.should.have.property('moduleManager')
  })

  it('can be started', async function() {
    runtime.portfolio.status.should.equal('CREATED')
    await runtime.portfolio.startAsync()
    runtime.portfolio.status.should.equal('READY')
  })
})
