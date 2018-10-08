require('chai').should()
const puppeteer = require('puppeteer')

describe('The Skypager Web Runtime Build', function() {
  let browser, page

  before(async function() {
    browser = await puppeteer.launch()
    page = await browser.newPage()
    const url = process.env.URL || process.env.TEST_URL
    await page.goto(`${url}/test.runtimes-web.html`)
  })

  it('passes its mocha test suite without any issues', async function() {
    const failures = await page.$eval('li.failures em', el => {
      return el.innerHTML
    })

    failures.toString().should.equal('0')
  })

  after(async function() {
    await browser.close()
  })
})
