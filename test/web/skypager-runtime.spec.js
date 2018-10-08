require('chai').should()
const puppeteer = require('puppeteer')
const runtime = require('@skypager/node')

describe('The Skypager Web Runtime Build', function() {
  let browser, page

  before(async function() {
    browser = await puppeteer.launch({
      headless: !runtime.argv.showBrowser,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    page = await browser.newPage()
    const url = process.env.URL || process.env.TEST_URL
    await page.goto(`${url}/test.runtime.html`)
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
