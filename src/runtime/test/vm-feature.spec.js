import { Runtime } from '../src/runtime'
const { sinon } = global

describe('The VM Feature', function() {
  const runtime = new Runtime()

  it('lets me create modules from strings', function() {
    const myModuleCode = `
      module.exports = {
        hello() { return 'world' }
      }
    `

    const myModule = runtime.createModule(myModuleCode, {
      filename: 'code.js',
      dirname: '/home',
    })

    myModule.should.have
      .property('exports')
      .that.is.an('object')
      .that.has.property('hello')
      .that.is.a('function')
  })
})
