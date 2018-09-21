import { Helper } from '@skypager/runtime'
import express from 'express'

export class Server extends Helper {
  static strictMode = false

  static isObservable = true
  static isCacheable = true

  static observables = {
    stats: ['shallowMap', {}],
    listening: false,
  }

  get status() {
    return this.runtime.convertToJS(this.stats.toJSON())
  }

  initialize() {
    this.hide('app', this.createServer(this.options, this.context))
  }

  createServer(options = {}, context = {}) {
    const {
      appWillMount = this.options.appWillMount || this.provider.appWillMount,
      createServer = this.options.createServer || this.provider.createServer,
    } = options

    let cors = this.tryResult('cors')
    let pretty = this.tryResult('pretty', () => process.env.NODE_ENV !== 'production')

    let app

    if (createServer) {
      app = createServer.call(this, options, context)
    } else {
      app = this.framework()
    }

    if (cors) {
      setupCors.call(this, app, cors)
    }

    if (pretty) {
      this.runtime.debug('Enabling pretty printing of JSON responses')
      app.use(require('express-prettify')({ query: 'pretty' }))
    }

    if (appWillMount) {
      this.runtime.debug('App Will Mount Hook was provided')
      appWillMount.call(this, app, options, context)
      this.runtime.debug('App Will Mount Hook was called')
    } else {
      this.runtime.debug('No App Will Mount Hook Was Provided')
    }

    return app
  }

  async mount(options = this.options, context = this.context) {
    const { app } = this
    const { appDidMount = this.options.appDidMount || this.provider.appDidMount } = options
    let {
      history = this.tryResult('history', () => false),
      serveStatic = this.tryResult('serveStatic', () => false),
    } = options

    this.runtime.debug('App Did Mount')

    if (appDidMount) {
      await appDidMount.call(this, app, options, context)
    }

    if (serveStatic) {
      this.runtime.debug('Setting up static file hosting')
      setupStaticServer.call(this, app, serveStatic)
    }

    if (history) {
      this.runtime.debug('Setting up history fallback for single page app hosting')
      setupHistoryFallback.call(this, app, history)
    }

    return app
  }

  async start(...args) {
    const {
      serverDidFail = this.provider.serverDidFail,
      serverWillStart = this.provider.serverWillStart,
    } = this.options

    if (!this.stats.get('mounted')) {
      await this.mount(...args)
    }

    if (serverWillStart) {
      this.runtime.debug('server will start hook')
      await serverWillStart.call(this, this.options, this.context)
      this.runtime.debug('server will start hook finished')
    }

    try {
      this.runtime.debug('startServer started')
      await this.startServer(...args)
      this.runtime.debug('startServer finished')
      this.stats.set('started', true)
    } catch (err) {
      this.stats.set('started', false)
      this.stats.set('failed', true)
      this.runtime.error('startServerFailed')

      if (serverDidFail) {
        this.runtime.debug('server did fail hook')
        await serverDidFail.call(this, { error: err }, this.context)
        this.runtime.debug('server did fail hook finished')
      }

      throw err
    }

    if (this.options.showBanner !== false) {
      if (this.tryGet('displayBanner')) {
        this.tryResult('displayBanner')
      } else {
        this.runtime.cli.clear()
        this.runtime.cli.randomBanner(`Skypager`)
        this.runtime.cli.print(`The Server is started`)
        this.runtime.cli.print([`Open in your browser:`, `http://${this.hostname}:${this.port}`])
      }
    }

    this.stats.set('started', true)
    return this
  }

  startServer(...args) {
    return new Promise((resolve, reject) => {
      const handler = this.starter.bind(this, ...args)
      handler(err => (err ? reject(err) : resolve(this)))
      this.hide('handler', handler)
    })
  }

  get port() {
    return this.tryResult('port', 3000)
  }

  get hostname() {
    return this.tryResult('hostname', () => this.tryResult('host', '0.0.0.0'))
  }

  get socketPath() {
    return this.tryResult('socketPath')
  }

  get starter() {
    const fn = this.tryGet('provider.start', function(cb) {
      return this.app.listen(this.port, this.hostname, err => {
        if (err) {
          this.runtime.error(`Server failed to start: ${err.message}`)
          cb(err)
          return
        }
        cb()
      })
    })

    return fn.bind(this)
  }

  get framework() {
    return this.tryGet('framework', this.express)
  }

  get express() {
    return this.constructor.express
  }

  static get express() {
    return express
  }

  static attach(host, options = {}) {
    return Helper.attach(host, Server, {
      registry: Helper.createContextRegistry('servers', {
        context: Helper.createMockContext(),
      }),
      ...options,
    })
  }
}

export const registerHelper = () => Helper.registerHelper('server', () => Server)

export default Server
export const attach = Server.attach

function setupHistoryFallback(app, historyOptions) {
  const { runtime } = this
  const history = require('express-history-api-fallback')

  if (historyOptions === true) {
    const htmlFile = runtime.resolve('build', 'index.html')
    app.use(
      history(htmlFile, {
        root: runtime.resolve('build'),
      })
    )
    this.runtime.debug(`Using history fallback`, this.runtime.relative(htmlFile))
  } else if (typeof historyOptions === 'object') {
    let { htmlFile = runtime.resolve('build', 'index.html') } = historyOptions

    htmlFile = runtime.resolve(htmlFile)

    this.runtime.debug(`Using history fallback`, this.runtime.relative(htmlFile))

    app.use(
      history(htmlFile, {
        root: runtime.resolve(historyOptions.root || runtime.pathUtils.dirname(htmlFile)),
      })
    )
  }

  return app
}

function setupCors(app, corsOptions) {
  const cors = require('cors')

  if (corsOptions === true) {
    app.use(cors({ origin: '*', optionSuccessStatus: 200 }))
  } else if (typeof corsOptions === 'object') {
    app.use(cors(corsOptions))
  }

  return app
}

function setupStaticServer(app, staticOptions) {
  const { runtime, express } = this
  const { isArray } = this.lodash

  if (typeof staticOptions === 'string') {
    app.use(express.static(runtime.resolve(staticOptions)))
    this.runtime.debug('serving static files', { staticOptions })
  } else if (staticOptions === true) {
    app.use(express.static(runtime.resolve('build')))
    this.runtime.debug('serving static files from build/')
  } else if (typeof staticOptions === 'object') {
    app.use(express.static(runtime.resolve(staticOptions.path || staticOptions.root)))
    this.runtime.debug('serving static files from', staticOptions)
  } else if (isArray(staticOptions)) {
    staticOptions.map(option => setupStaticServer.call(this, app, option))
  }

  return app
}
