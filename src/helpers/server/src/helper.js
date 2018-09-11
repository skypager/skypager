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
    const { appWillMount, createServer } = this.provider

    let app

    if (createServer) {
      app = createServer.call(this, options, context)
    } else {
      app = this.framework()
    }

    if (appWillMount) {
      appWillMount.call(this, app)
    }

    return app
  }

  async start(...args) {
    const { app } = this
    const { debug, error } = this.runtime.logger
    const { serverDidFail, serverWillStart } = this.provider

    debug('Server will start', { providesMethod: typeof serverWillStart === 'function' })

    if (serverWillStart) {
      await serverWillStart.call(this, this.options, this.context)
    }

    debug('Server starting', { args })

    try {
      await this.startServer(...args)
      this.stats.set('started', true)
    } catch (err) {
      this.stats.set('started', false)
      this.stats.set('failed', true)

      /*
      if (serverDidFail) {
        await serverDidFail.call(this, { error: err }, this.context)
      }
      */
    }

    return this
  }

  startServer(...args) {
    const { debug, error } = this.runtime.logger

    return new Promise((resolve, reject) => {
      const handler = this.starter(
        ...args.push(err => {
          err
            ? error('error while starting', { error: err })
            : debug('started server', {
                port: this.port,
                hostname: this.hostname,
                id: this.id,
                name: this.name,
              })
          err ? reject(err) : resolve(this)
        })
      )

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
    const fn = this.tryGet('provider.start', function(...args) {
      return this.app.listen(this.port, this.hostname, ...args)
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
