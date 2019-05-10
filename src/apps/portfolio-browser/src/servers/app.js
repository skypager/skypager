import { Server } from '@skypager/helpers-server'
import setupGraphQL from '../graphql'

export default class PortfolioBrowserServer extends Server {
  get projectConfigKeys() {
    return ['runtime.projectConfig.server', 'runtime.argv']
  }
  get history() {
    const { runtime } = this
    return !runtime.isDevelopment
  }

  get serveStatic() {
    const { runtime } = this
    return !runtime.isDevelopment
  }

  get cors() {
    return true
  }

  async appDidMount(app) {
    app.use((req, res, next) => {
      const { pathname } = this.runtime.urlUtils.parseUrl(req.url)
      console.log(`${req.method.toUpperCase()} ${pathname}`)
      next()
    })

    if (this.runtime.isDevelopment) {
      setupDevelopment.call(this, app, this.options)
    }

    return app
  }
}

function setupDevelopment(app, options) {
  const webpack = require('webpack')
  const merge = require('webpack-merge')
  const devMiddleware = require('webpack-dev-middleware')
  const hotMiddleware = require('webpack-hot-middleware')
  const config = merge(require('@skypager/webpack/config/webpack.config')('development'), {
    node: {
      process: 'mock',
    },
    externals: [
      {
        react: 'global React',
        'react-dom': 'global ReactDOM',
        'react-router-dom': 'global ReactRouterDOM',
        'semantic-ui-react': 'global semanticUIReact',
        'prop-types': 'global PropTypes',
        '@skypager/web': 'global skypager',
        '@skypager/runtime': 'global skypager',
      },
    ],
  })

  // hack, temporary to remove the webpack hot dev client that gets put in the config automatically

  config.entry.app.shift()

  this.setupDevelopmentMiddlewares({
    ...options,
    webpack,
    config,
    devMiddleware,
    hotMiddleware,
  })

  return app
}

export function appWillMount(app, options = {}, context = {}) {
  return app
}
