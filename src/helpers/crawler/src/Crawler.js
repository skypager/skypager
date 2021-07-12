import { Helper } from '@skypager/runtime'
import puppeteer from 'puppeteer'
import PuppeteerHar from 'puppeteer-har'
import DeviceDescriptors from 'puppeteer/DeviceDescriptors'
import lighthouse from 'lighthouse'

export default class Crawler extends Helper {
  static registryName() {
    return 'crawlers'
  }

  static isCacheable = false

  static isCrawlerHelper = true

  static registryProp = 'crawlers'

  static lookupProp = 'crawler'

  static strictMode = false

  static allowAnonymousProviders = true

  static attach(host, options = {}) {
    const registration = Helper.attach(host, Crawler, {
      registry: Helper.createContextRegistry('crawlers', {
        context: Helper.createMockContext({}),
      }),
      ...options,
    })

    return registration
  }

  async run(options = {}) {
    const { waitFor, stopHar = true, waitForIdle = true } = options

    const harPath = this.tryResult('harPath')
    const tracePath = this.tryResult('tracePath')
    await this.setupPupeteer(options)

    await this.har.start({
      ...(harPath && { path: harPath }),
    })

    let pageDidLoad
    this.page.once('load', () => {
      pageDidLoad = true
    })

    await this.page.tracing.start()

    await this.goto(this.url, {
      ...(waitForIdle && { waitFor: 'networkidle0' }),
    })

    if (!waitForIdle) {
      await new Promise(res => {
        if (pageDidLoad) {
          res()
          return
        }
        this.page.once('load', () => {
          res()
        })
      })
    }

    if (typeof waitFor === 'number') {
      await new Promise(res => setTimeout(res, waitFor))
    }

    if (stopHar) {
      await this.stopHar()
    }

    const traceData = await this.page.tracing.stop()

    this.hide('_tracingData', JSON.parse(String(traceData)))

    return this
  }

  async lighthouse(options = {}) {
    const { logLevel = 'error' } = options

    const url = this.currentUrl

    const results = await lighthouse(url, {
      port: this.wsPort,
      output: 'json',
      logLevel,
    })

    this.hide('_lhr', results.lhr)
    return results
  }

  get lhr() {
    return this._lhr
  }

  get tracingData() {
    return this._tracingData
  }

  async cookies() {
    return this.page.cookies()
  }

  async content() {
    return this.page.content()
  }

  get wasRedirected() {
    return !!this.harEntries.find(
      ({ response = {} } = {}) => response.status === 302 || response.status === 301
    )
  }

  get url() {
    return this.tryResult('url')
  }

  get uri() {
    return this.runtime.urlUtils.parse(this.url)
  }

  get browser() {
    return this._browser || this.tryResult('browser')
  }

  get page() {
    return this._page || this.tryResult('page')
  }

  get currentUrl() {
    return this.page.url()
  }

  get deviceDescriptors() {
    return this.lodash.keyBy(DeviceDescriptors, 'name')
  }

  get requestedUrls() {
    return this.harEntries.map(({ request }) => request.url)
  }

  get requestedHosts() {
    const { parseUrl } = this.runtime.urlUtils
    const { uniq } = this.lodash
    return uniq(this.requestedUrls.map(url => parseUrl(url).hostname))
  }

  get requestedUrlsByHost() {
    const { mapValues, groupBy } = this.lodash
    const { parseUrl } = this.runtime.urlUtils
    return mapValues(
      groupBy(this.requestedUrls, url => parseUrl(url).hostname),
      v => parseUrl(v).path
    )
  }

  get requestsByHost() {
    const { groupBy } = this.lodash
    const { parseUrl } = this.runtime.urlUtils
    return groupBy(this.harEntries, ({ request }) => parseUrl(request.url).hostname)
  }

  get documentRequest() {
    return this.harEntries.find(({ request }) => request.url === this.currentUrl)
  }

  get documentResponseHeaders() {
    return this.documentRequest.response.headers.reduce(
      (memo, pair) => ({
        ...memo,
        [pair.name]: pair.value,
      }),
      {}
    )
  }

  get har() {
    return this._har
  }

  get harData() {
    return this._harData
  }

  get harEntries() {
    return this.get('harData.log.entries', [])
  }

  async stopHar() {
    const harData = await this.har.stop()
    this.hide('_harData', harData)
    return harData
  }

  async saveHar(path) {
    await this.runtime.fsx.writeJsonAsync(this.runtime.resolve(path), this.harData)
    return this.runtime.resolve(path)
  }

  async saveTrace(path) {
    await this.runtime.fsx.writeJsonAsync(this.runtime.resolve(path), this.traceData)
    return this.runtime.resolve(path)
  }

  async close() {
    await this.browser.close()
    return this
  }

  async goto(url = this.url) {
    await this.page.goto(url)
  }

  async setupPupeteer(options = {}) {
    const { lighthouse = false, headless = true, device, launchArgs = [] } = {
      ...this.options,
      ...options,
    }

    if (lighthouse) {
      launchArgs.push('--show-paint-rects')
    }

    const launchOptions = this.tryGet('launchOptions', {})

    if (!this.browser) {
      const browser = await puppeteer.launch({
        headless,
        defaultViewport: null,
        args: [...launchArgs],
        ...launchOptions,
      })
      this.hide('_browser', browser)

      const wsEndpoint = await browser.wsEndpoint()

      this.wsEndpoint = wsEndpoint
      this.wsPort = this.runtime.urlUtils.parseUrl(wsEndpoint).port
    }

    if (!this.page) {
      const page = await this.browser.newPage()
      const har = new PuppeteerHar(page)
      this.hide('_page', page)
      this.hide('_har', har)

      this.page.on('request', request => {
        this.receivedRequest(request)
      })
      this.page.on('response', response => {
        this.onResponse(response)
      })
    }

    if (this.deviceDescriptors[device]) {
      await this.page.emulate(this.deviceDescriptors[device])
    }

    return this
  }

  $eval(...args) {
    return this.page.$eval(...args)
  }

  $$eval(...args) {
    return this.page.$$eval(...args)
  }

  receivedRequest(request) {
    const receivedRequest = this.tryGet('receivedRequest', this.tryGet('onRequest', () => {}))
    Promise.resolve(receivedRequest(request))
  }

  onResponse(response) {
    const receivedResponse = this.tryGet('receivedResponse', this.tryGet('onResponse', () => {}))
    Promise.resolve(receivedResponse(response))
  }
}

export { Crawler }

export const registerHelper = () => Helper.registerHelper('crawler', () => Crawler)

export const attach = Crawler.attach
