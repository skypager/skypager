const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const { DefinePlugin } = require('webpack')
const { name, version } = require('./package.json')

process.env.MINIFY = true
const baseProdConfig = require('@skypager/webpack/config/webpack.config.prod')

const webConfig = merge.strategy({ plugins: 'replace', entry: 'replace', node: 'replace' })(
  baseProdConfig,
  {
    name: 'web',
    node: {
      process: false,
      global: false,
      vm: false,
    },
    resolve: {
      alias: {
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtimes-web': path.resolve(cwd, 'src', 'index.js'),
    },
    plugins: baseProdConfig.plugins
      .filter(p => !p.constructor || !p.constructor.name === 'UglifyJsPlugin')
      .concat([
        new DefinePlugin({
          __PACKAGE__: JSON.stringify({ name, version }),
        }),
      ]),
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace', node: 'replace' })(baseProdConfig, {
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
})

const nodeConfig = merge.strategy({ plugins: 'replace' })(baseProdConfig, {
  target: 'node',
  name: 'node',
  externals: [
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
  plugins: baseProdConfig.plugins
    .filter(p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin'))
    .concat([
      new DefinePlugin({
        __PACKAGE__: JSON.stringify({ name, version }),
      }),
    ]),
})

module.exports = process.env.ANALYZE ? nodeConfig : [webConfig, nodeConfig, minifiedWebConfig]
