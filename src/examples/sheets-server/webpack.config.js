const path = require('path')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const { name, version } = require('./package.json')
const { DefinePlugin } = require('webpack')
const SourceMapSupport = require('webpack-source-map-support')

process.env.DISABLE_ENV_INJECTION = true
const production = require('@skypager/webpack/config/webpack.config.prod')

production.plugins = production.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = merge.strategy({ entry: 'replace', node: 'replace', externals: 'replace' })(
  production,
  {
    name: 'node',
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
      process: false,
    },
    resolve: {
      alias: {
        runtime: path.resolve(__dirname, '..', '..', 'runtime', 'src'),
      },
    },
    externals: [
      nodeExternals({ modulesDir: path.resolve(__dirname, 'node_modules') }),
      nodeExternals({ modulesDir: path.resolve(__dirname, '..', '..', '..', 'node_modules') }),
    ],
    entry: {
      index: ['@babel/polyfill/noConflict', path.resolve(__dirname, 'src', 'index.js')],
    },
    plugins: [
      new DefinePlugin({
        __PACKAGE__: JSON.stringify({ name, version }),
      }),
      new SourceMapSupport(),
    ],
  }
)
