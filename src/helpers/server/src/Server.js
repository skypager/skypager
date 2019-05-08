import { Helper } from '@skypager/runtime'
import express from 'express'

/**
 * The Server Helper provides a generic interface on top of any server process that can be
 * created, configured, started, and stopped.  By default we provide an instance of an express app
 * with some common middleware enabled out of the box.  Technically the server helper is should be framework
 * agnostic, and can rely on dependency injection to use express, hapi, feathers.js, or whatever
 *
 */
export class Server extends Helper {
  static registryName() {
    return 'servers'
  }
  /**
   * By setting the Server class to be cacheable, we will always get the same instance of a server
   * when we ask for it by name with the same options we used when we requested it previously.
   */
  static isCacheable = true

  /**
   * This helps us distinguish provider implementations which export a subclass of Server
   * instead of a plain javascript object module with provider types
   */
  static isServerHelper = true

  /**
   * The Server helper will use this value for the name of the Server helper registry
   * which is aware of all of the available servers that can be created and started
   *
   * @example
   *
   *  const runtime = require('@skypager/node')
   *  const myServer = {
   *    appWillMount(app) { }
   *  }
   *
   *  runtime.servers.register('@my/server', myServer)
   */

  static registryProp = 'servers'

  /**
   * The Server helper will use this value for the name of the Server helper factory function
   * which is responsible for creating Server helper instances using the id that provider was registered with.
   *
   * @example
   *
   * const runtime = require('@skypager/node').use('@my/server')
   * const myServer = runtime.server('@my/server', { port: 3000 })
   */
  static lookupProp = 'server'

  /**
   * With strictMode set to true, only valid provider / option types will be used
   */
  static strictMode = false

  /**
   * By setting the Server class to be observable, we opt-in to various transformations and events that
   * get fired in the global event bus system.
   */
  static isObservable = true

  /**
   * Since our Helper class is set to be observable, each instance of the server helper that is created will
   * be extended with the following observable property interface.
   */
  static observables() {
    return {
      // the server throughout its operation can save state or statistic information in this observable map
      stats: ['shallowMap', {}],
      listening: false,
    }
  }

  /**
   * providerTypes describe the shape of the server helper implementation module.
   *
   * in the example below, the server is registered with a module, considered the provider
   *
   * the provider interface allows for a module to serve as the default source of truth for an implementation
   * of a Server helper.
   *
   * @example
   *
   *  const runtime = require('@skypager/node')
   *
   *  const myServerProvider = {
   *    async serverWillStart(app) {
   *      return app
   *    }
   *
   *    appWillMount(app) {
   *      app.get('/whatever', (req) => res.json({ whatever: true }))
   *    }
   *  }
   *
   *  runtime.servers.register('my-server', myServerProvider)
   *
   */
  static providerTypes = {
    // string all, or array of endpoint module ids
    endpoints: 'string|array<string>', // this will be called at the last moment before app is setup and ready to listen
    setupHistoryFallback: 'func', // if you want to setup your own static middleware this will be called at the end before history fallback setup
    setupStaticServer: 'func', // a function which should return a server configuration api, like express
    createServer: 'func', // this synchronous hook will be called once the server has been created
    appWillMount: 'func', // this hook will be called after the server has been created and mounted
    appDidMount: 'async', // this function will be called asynchronously, and expect to resolve when the server can finally start listening
    serverWillStart: 'async', // this function will be called asynchronously if the server failed to start
    serverDidFail: 'async', // this function will be called right after the barebones express instance is created, before cors is enabled
    serverWasCreated: 'func', // a function which returns a boolean or an object
    // an object is any valid options for cors
    // true is the default cors options
    cors: 'func|boolean|object', // an object is any valid options for express-history-api-fallback // a function which returns a boolean or an object
    // true is the default express history api fallback options
    history: 'func|boolean|object', // an object is any valid options for express static // a function which returns a boolean or an object
    // true is the default options for express static
    serveStatic: 'func|boolean|object',
  }
  /**
   * @public
   *
   * You can call the start() method whenever you're ready to use your server.
   *
   * It will trigger the server lifecycle hooks:
   *
   *  - appWillMount
   *  - async appDidMount
   *  - async serverWillStart
   *  - async startServer
   *  - async serverDidFail
   *
   * Which you can implement in your server
   */
  async start(...args) {
    const {
      serverDidFail = this.serverDidFail ||
        this.options.serverDidFail ||
        this.provider.serverDidFail,
      serverWillStart = this.serverWillStart || this.provider.serverWillStart,
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

    if (this.tryGet('showBanner') !== false && this.runtime.argv.banner !== false) {
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

  /**
   * Returns any recorded stats tracked by this server
   */
  get status() {
    return this.runtime.convertToJS(this.stats.toJSON())
  }

  /**
   * @private
   *
   * The initialize hook on our class is automatically called by every Helper instance during the construction
   * of that instance.  We rely on it to create the actual server configuration object (an instance of express() in this case)
   */
  initialize() {
    this.hide('app', this.createServer(this.options, this.context))
  }

  /**
   * @private
   * The createServer function
   */
  createServer(options = this.options, context = this.context) {
    const {
      appWillMount = this.appWillMount || this.options.appWillMount || this.provider.appWillMount,
      createServer = this.options.createServer || this.provider.createServer,
      serverWasCreated = this.serverWasCreated ||
        this.options.serverWasCreated ||
        this.provider.serverWasCreated,
      enableLogging = this.options.enableLogging || this.provider.enableLogging,
    } = options

    let {
      loggerOptions = this.loggeOptions ||
        this.options.loggerOptions ||
        this.provider.loggerOptions,
    } = options

    let {
      cors = this.tryResult('cors'),
      pretty = this.tryResult('pretty') ||
        this.tryResult('pretty', () => process.env.NODE_ENV !== 'production'),
    } = options

    let app

    if (createServer) {
      app = createServer.call(this, options, context)
    } else {
      app = this.framework()
    }

    if (serverWasCreated) {
      serverWasCreated.call(this, app, options, context)
    }

    if (cors) {
      setupCors.call(this, app, cors)
    }

    if (pretty) {
      this.runtime.debug('Enabling pretty printing of JSON responses')
      app.use(require('express-prettify')({ query: 'pretty' }))
    }

    if (enableLogging) {
      const winston = require('winston')
      const expressWinston = require('express-winston')

      if (!loggerOptions) {
        loggerOptions = {
          transports: [
            new winston.transports.Console({
              prettyPrint: this.options.prettyPrintLogs !== false,
              json: this.options.jsonLogs,
              meta: this.options.logMeta !== false,
              colorize: !!this.options.colorizeLogs,
            }),
          ],
          prettyPrint: this.options.prettyPrintLogs !== false,
          json: true,
          meta: this.options.logMeta !== false,
          colorize: !!this.options.colorizeLogs,
        }
      }

      app.use(expressWinston.logger(loggerOptions))
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

  /**
   * @private
   *
   * This method will be called after the server is created, after the appWillMount hook fires, right when
   * the start() method is called.It will trigger the calling of an appDidMount hook supplied by the implementation,
   * and it is at the end of this phase that the history and static middlewares are finally setup.
   */
  async mount(options = this.options, context = this.context) {
    const { app } = this
    const { isString } = this.lodash

    let endpoints = options.endpoints || this.tryResult('endpoints', [])

    if (endpoints === 'all') {
      endpoints = this.endpoints.available
    }

    if (endpoints.length) {
      endpoints.forEach(endpoint => {
        if (isString(endpoint)) {
          let handler = this.endpoints.lookup(endpoint)
          handler = handler.default || handler
          handler.call(this, app, options, context)
        } else {
          throw new Error(
            `Must pass an array of endpoint ids from the endpoints registry, or valid endpoint functions`
          )
        }
      })
    }

    let {
      history = options.history || this.tryResult('history', () => false),
      serveStatic = options.serverStatic || this.tryResult('serveStatic', () => false),
    } = this

    this.runtime.debug('Running App Did Mount Hook')

    await this.attemptMethodAsync('appDidMount', app)

    this.runtime.debug('Ran App Did Mount Hook')

    if (serveStatic) {
      this.runtime.debug('Setting up static file hosting')
      const staticSetupHook = this.tryGet('setupStaticServer', setupStaticServer, [
        'options',
        'provider',
      ])
      staticSetupHook.call(this, app, serveStatic)
    }

    if (history) {
      this.runtime.debug('Setting up history fallback for single page app hosting')
      const historySetupHook = this.tryGet('setupHistoryFallback', setupHistoryFallback, [
        'options',
        'provider',
      ])
      historySetupHook.call(this, app, history)
    }

    return app
  }

  setupHistoryFallback(options = {}) {
    return setupHistoryFallback.call(this, this.app, options)
  }

  setupStaticServer(options = {}) {
    return setupStaticServer.call(this, this.app, options)
  }

  setupDevelopmentMiddlewares(options = {}) {
    return setupDevelopmentMiddlewares.call(this, this.app, options)
  }

  startServer(...args) {
    return new Promise((resolve, reject) => {
      const handler = this.starter.bind(this, ...args)
      handler(err => (err ? reject(err) : resolve(this)))
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
    const fn = this.tryGet('createStarter', function(cb) {
      const server = this.app.listen(this.port, this.hostname, err => {
        if (err) {
          this.runtime.error(`Server failed to start: ${err.message}`)
          cb(err)
          return
        }

        this.stop = cb => server.close(cb)

        cb(null, server)
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

  get endpoints() {
    return this.runtime && this.runtime.endpoints
  }

  static get express() {
    return express
  }

  static attach(host, options = {}) {
    const registration = Helper.attach(host, Server, {
      registry: Helper.createContextRegistry('servers', {
        context: Helper.createMockContext({}),
      }),
      ...options,
    })

    if (!host.has('endpoints')) {
      host.lazy('endpoints', () =>
        Helper.createContextRegistry('endpoints', {
          context: Helper.createMockContext({}),
        })
      )
    }

    return registration
  }
}

export const registerHelper = () => Helper.registerHelper('server', () => Server)

export default Server

export const attach = Server.attach

// TODO you should be able to use @skypager/helpers-server without webpack
function injectWebpackDependencies(base = {}) {
  return base
}

function setupDevelopmentMiddlewares(app, options = {}) {
  const { runtime } = this
  const { hot } = options
  const { config, webpack, devMiddleware, hotMiddleware } = injectWebpackDependencies.call(
    this,
    options
  )

  config.entry[1] = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000'

  const compiler = webpack(config)
  const middleware = devMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
  })

  app.use(middleware)

  if (hot) {
    app.use(
      hotMiddleware(compiler, {
        path: '/__webpack_hmr',
      })
    )
  }

  app.use((req, res, next) => {
    const { pathname } = runtime.urlUtils.parseUrl(req.url)
    const { base, ext, dir } = runtime.pathUtils.parse(pathname)

    // it must be index.html
    if (ext === '') {
      res.end(
        middleware.fileSystem.readFileSync(runtime.pathUtils.join(config.output.path, 'index.html'))
      )
    } else {
      res.end(
        middleware.fileSystem.readFileSync(
          runtime.pathUtils.join(config.output.path, pathname.replace(/^\//, ''))
        )
      )
    }
  })

  return app
}

function setupHistoryFallback(app, historyOptions) {
  const { runtime } = this
  const history = require('express-history-api-fallback')

  if (historyOptions === true) {
    app.use(
      history('index.html', {
        root: runtime.resolve('build'),
      })
    )
  } else if (typeof historyOptions === 'object') {
    let { htmlFile = 'index.html', root: historyRoot = runtime.resolve('build') } = historyOptions
    app.use(history(runtime.pathUtils.basename(htmlFile), { root: runtime.resolve(historyRoot) }))
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
