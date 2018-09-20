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
      appDidMount = this.options.appDidMount || this.provider.appDidMount,
      createServer = this.options.createServer || this.provider.createServer,
    } = options

    let history = this.tryResult('history', () => false)
    let serveStatic = this.tryResult('serveStatic', () => false)
    let cors = this.tryResult('cors')

    let app

    if (createServer) {
      app = createServer.call(this, options, context)
    } else {
      app = this.framework()
    }

    if (cors) {
      setupCors.call(this, app, cors)
    }

    if (appWillMount) {
      appWillMount.call(this, app, options, context)
    }

    if (appDidMount) {
      appDidMount.call(this, app, options, context)
    }

    if (serveStatic) {
      setupStaticServer.call(this, app, serveStatic)
    }

    if (history) {
      setupHistoryFallback.call(this, app, history)
    }

    return app
  }

  async start(...args) {
    const { app } = this
    const { debug, error } = this.runtime.logger
    const { serverDidFail, serverWillStart } = this.provider

    if (serverWillStart) {
      await serverWillStart.call(this, this.options, this.context)
    }

    try {
      await this.startServer(...args)
      this.stats.set('started', true)
    } catch (err) {
      this.stats.set('started', false)
      this.stats.set('failed', true)

      console.error(err)

      if (serverDidFail) {
        await serverDidFail.call(this, { error: err }, this.context)
      }

      throw err
    }

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
    return this.tryGet('provider.framework', this.express)
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
    app.use(
      history(runtime.resolve('build', 'index.html'), {
        root: runtime.resolve('build'),
      })
    )
  } else if (typeof historyOptions === 'object') {
    let { htmlFile = runtime.resolve('build', 'index.html') } = historyOptions

    htmlFile = runtime.resolve(htmlFile)

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
  } else if (staticOptions === true) {
    app.use(express.static(runtime.resolve('build')))
  } else if (typeof staticOptions === 'object') {
    app.use(express.static(runtime.resolve(staticOptions.path || staticOptions.root)))
  } else if (isArray(staticOptions)) {
    staticOptions.map(option => setupStaticServer.call(this, app, option))
  }

  return app
}
