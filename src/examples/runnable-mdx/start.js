const runtime = require('@skypager/node').use(require('@skypager/helpers-document'))
const bodyParser = require('body-parser')
const mdx = require('./endpoints/mdx')
const babel = require('./endpoints/babel')

const AppServer = {
  cors: true,
  pretty: true,
  serveStatic: 'lib',
  history: !runtime.isDevelopment,
  appWillMount(app) {
    app.use(bodyParser.json())
  },
  async appDidMount(app) {
    if (runtime.isDevelopment) {
      setupDevelopment.call(this, app, this.options)
    }
  },
}

runtime.servers.add({
  app: AppServer,
})

runtime.endpoints.add({
  babel,
  mdx,
})

async function main() {
  if (runtime.argv.buildDocHelper) {
    await runtime.proc.async.spawn('yarn', ['build:web', '--include-unminified'], {
      cwd: runtime.resolve('..', '..', 'helpers', 'document'),
      stdio: 'inherit',
    })
    await runtime.proc.async.spawn('skypager', ['hash-build'], {
      cwd: runtime.resolve('..', '..', 'helpers', 'document'),
      stdio: 'inherit',
    })
  }

  if (runtime.argv.buildDocHelper) {
    await runtime.proc.async.spawn('yarn', ['build:app'], {
      stdio: 'inherit',
    })
    await runtime.proc.async.spawn('skypager', ['hash-build'], {
      stdio: 'inherit',
    })
  }

  const port = await runtime.networking.findOpenPort(3000)

  if (runtime.isDevelopment) {
    copyPublicFolder(runtime.resolve('public'), runtime.resolve('lib'))
    runtime.argv.mdxBundle && generateMdxBundle()
  }

  const server = runtime.server('app', {
    port,
    ...(!runtime.isDevelopment && {
      history: {
        htmlFile: 'index.html',
        root: runtime.resolve('lib'),
      },
    }),
    endpoints: ['babel', 'mdx'],
    showBanner: false,
  })

  await server.start()

  console.log(`Server is listening on http://localhost:${server.port}`)

  if (runtime.argv.open) {
    await runtime.opener.openInBrowser(`http://localhost:${server.port}`)
  }
}

main()

function generateMdxBundle() {
  runtime.proc.spawnSync('yarn', ['bundle:mdx'], {
    stdio: 'inherit',
  })
}

function copyPublicFolder(from, to) {
  runtime.fsx.copySync(from, to, {
    dereference: true,
    filter: file => !String(file).match(/index.html$/),
  })
}

function setupDevelopment(app, options) {
  const webpack = require('webpack')
  const devMiddleware = require('webpack-dev-middleware')
  const hotMiddleware = require('webpack-hot-middleware')
  const config = require('@skypager/webpack/config/webpack.config')('development')

  config.entry = {
    app: [runtime.resolve('src', 'launch.js')],
  }

  this.setupDevelopmentMiddlewares({
    ...options,
    webpack,
    config,
    devMiddleware,
    hotMiddleware,
    hot: !!(options.hot || this.options.hot),
  })

  return app
}
