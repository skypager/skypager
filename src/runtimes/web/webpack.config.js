const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const { DefinePlugin } = require('webpack')
const { name, version } = require('./package.json')

const webConfig = merge.strategy({ entry: 'replace', node: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    node: false,
    resolve: {
      alias: {
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtimes-web': path.resolve(cwd, 'src', 'index.js'),
    },
    plugins: [
      new DefinePlugin({
        __PACKAGE__: JSON.stringify({ name, version }),
      }),
    ],
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace', node: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    node: false,
    resolve: {
      alias: {
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtimes-web.min': path.resolve(cwd, 'src', 'index.js'),
    },
    plugins: [
      new DefinePlugin({
        __PACKAGE__: JSON.stringify({ name, version }),
      }),
    ],
  }
)

const nodeConfig = merge(require('@skypager/webpack/config/webpack.config.prod'), {
  target: 'node',
  name: 'node',
  externals: [
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
  plugins: [
    new DefinePlugin({
      __PACKAGE__: JSON.stringify({ name, version }),
    }),
  ],
})

webConfig.plugins = webConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

nodeConfig.plugins = nodeConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = process.env.ANALYZE ? nodeConfig : [webConfig, nodeConfig, minifiedWebConfig]
