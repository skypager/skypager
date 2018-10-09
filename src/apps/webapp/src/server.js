export function history() {
  return !this.runtime.isDevelopment
}

export function serveStatic() {
  return !this.runtime.isDevelopment
}

export const cors = true

export async function appDidMount(app) {
  const { runtime } = this

  if (runtime.isDevelopment) {
    setupDevelopment.call(this, app)
  }

  return app
}

export function setupDevelopment(app) {
  const { runtime } = this
  const serviceAccount = runtime.fsx.readJsonSync(runtime.resolve('secrets', 'serviceAccount.json'))
  const { hot } = this.options
  const webpack = require('webpack')
  const merge = require('webpack-merge')
  const devMiddleware = require('webpack-dev-middleware')
  const hotMiddleware = require('webpack-hot-middleware')
  const config = merge(require('@skypager/webpack/config/webpack.config.dev'), {
    node: {
      process: 'mock',
    },
    plugins: [
      new webpack.DefinePlugin({
        SERVICE_ACCOUNT_EMAIL: JSON.stringify(serviceAccount.client_email),
        SERVICE_ACCOUNT_PROJECT_ID: JSON.stringify(serviceAccount.project_id),
      }),
    ],
    externals: [
      {
        react: 'global React',
        'react-dom': 'global ReactDOM',
        'react-router-dom': 'global ReactRouterDOM',
        'semantic-ui-react': 'global semanticUIReact',
        'prop-types': 'global PropTypes',
        '@skypager/web': 'global skypager',
      },
    ],
  })

  config.entry[1] = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000'

  const compiler = webpack(config)
  const middleware = devMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
  })

  app.use(middleware)

  if (hot !== false) {
    app.use(
      hotMiddleware(compiler, {
        path: '/__webpack_hmr',
      })
    )
  }

  /*
  app.get('*', (req, res) => {
    middleware.fileSystem.readFile(
      runtime.pathUtils.resolve(compiler.outputPath, 'index.html'),
      (err, file) => {
        if (err) {
          res.sendStatus(404)
        } else {
          res.send(file.toString())
        }
      }
    )
  })
  */

  return app
}

export function appWillMount(app, options = {}, context = {}) {
  const { runtime } = this
  const { isEmpty } = this.lodash
  const { colors } = runtime.cli

  runtime.debug('Mounting sheets app')

  app.use((req, _, next) => {
    !isEmpty(req.params)
      ? runtime.info(`${colors.green(req.method)} ${req.url}`, req.params)
      : runtime.info(`${colors.green(req.method)} ${req.url}`)
    next()
  })

  app.get('/sheets', (req, res) => {
    const data = runtime.sheets.allMembers()
    res.json(data)
  })
  app.get('/sheets-meta/:sheetName', (req, res) => {
    const { sheetName } = req.params

    if (!sheetName || !sheetName.length || !runtime.sheets.checkKey(req.params.sheetName)) {
      res.status(404).json({ notFound: true, error: true, sheetName })
    } else {
      const sheet = runtime.sheet(sheetName)

      sheet.whenReady().then(() => {
        res.json({
          info: sheet.info,
          worksheets: sheet.worksheets,
        })
      })
    }
  })
  app.get('/sheets/:sheetName', (req, res) => {
    const { sheetName } = req.params

    if (!sheetName || !sheetName.length || !runtime.sheets.checkKey(req.params.sheetName)) {
      res.status(404).json({ notFound: true, error: true, sheetName })
    } else {
      const sheet = runtime.sheet(sheetName)

      sheet
        .whenReady()
        .then(() => (!req.params.refresh && sheet.has('data') ? sheet.data : sheet.loadAll()))
        .then(data => res.status(200).json(data))
        .catch(error => {
          runtime.error(error.message)
          console.log(error.stack)
          res.status(500).send('<pre>' + error.message + '\n' + error.stack + '</pre>')
        })
    }
  })

  app.get('/sheets/:sheetName/:worksheetId', (req, res) => {
    const { worksheetId, sheetName } = req.params

    if (!sheetName || !sheetName.length || !runtime.sheets.checkKey(req.params.sheetName)) {
      runtime.error(`404 ${req.method} ${req.url}`)
      res.status(404).json({ notFound: true, error: true, sheetName })
    } else {
      const sheet = runtime.sheet(sheetName)

      sheet
        .whenReady()
        .then(() => (!req.params.refresh && sheet.has('data') ? sheet.data : sheet.loadAll()))
        .then(data => {
          if (worksheetId === '_info') {
            res.status(200).json(sheet.info)
          } else if (!data[worksheetId]) {
            res.status(404).send('Invalid Worksheet')
          } else {
            res.status(200).json(data[worksheetId])
          }
        })
        .catch(error => {
          runtime.error(`500 ${req.method} ${req.url}`, error.message)
          console.log(error.stack)
          res.status(500).send('<pre>' + error.message + '\n' + error.stack + '</pre>')
        })
    }
  })

  return app
}
