import runtime, { Helper } from '../src'

export class Page extends Helper {
  static asyncMode = true
}

runtime.use(Page)

function HomePage() {}

async function loadHomePage() {
  return {
    get default() {
      global.HomePageLoaded = true
      return HomePage
    },
    path: '/',
    title: 'Home',
  }
}

describe('async helpers runtime', function() {
  it('should have a pages registry', function() {
    runtime.should.have
      .property('pages')
      .that.is.an('object')
      .that.has.property('register')
      .that.is.a('function')
  })
  it('should have a pages factory', function() {
    runtime.should.have.property('page').that.is.a('function')
  })

  it('should support async loaded modules', async function() {
    global.HomePageLoaded = false

    runtime.pages.register('HomePage', () => loadHomePage())

    global.HomePageLoaded.should.equal(false)
    const homePage = await runtime.page('HomePage')
    global.HomePageLoaded.should.equal(true)

    homePage.should.have
      .property('provider')
      .that.is.an('object')
      .that.has.property('path', '/')
  })
})
