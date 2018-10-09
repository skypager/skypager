const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')

const orig = process.env.MINIFY
process.env.MINIFY = true
const baseProductionConfig = require('@skypager/webpack/config/webpack.config.prod')
const baseCommonConfig = require('@skypager/webpack/config/webpack.config.common')
process.env.MINIFY = orig || false

const minifiedWebConfig = merge.strategy({ node: 'replace', entry: 'replace' })(
  baseProductionConfig,
  {
    name: 'web',
    node: {
      process: 'mock',
      global: false,
    },
    resolve: {
      alias: {
        lodash: require.resolve('lodash/lodash.min.js'),
        mobx: path.resolve(cwd, 'src', 'mobx.umd.min.js'),
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtime.min': ['@babel/polyfill/noConflict', path.resolve(cwd, 'src', 'index.js')],
    },
  }
)

const webConfig = merge.strategy({ node: 'replace', entry: 'replace', plugins: 'replace' })(
  baseProductionConfig,
  {
    name: 'web',
    node: {
      process: 'mock',
      global: false,
    },
    resolve: {
      alias: {
        lodash: require.resolve('lodash/lodash.min.js'),
        mobx: path.resolve(cwd, 'src', 'mobx.umd.min.js'),
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtime': ['@babel/polyfill/noConflict', path.resolve(cwd, 'src', 'index.js')],
    },
    plugins: baseProductionConfig.plugins.filter(
      p => !p.constructor || !p.constructor.name === 'UglifyJsPlugin'
    ),
  }
)

const nodeConfig = merge.strategy({ node: 'replace', plugins: 'replace' })(baseCommonConfig, {
  target: 'node',
  name: 'node',
  node: false,
  devtool: 'source-map',
  entry: {
    index: ['@babel/polyfill/noConflict', path.resolve(cwd, 'src', 'index.js')],
    'utils/emitter': 'utils/emitter.js',
    'utils/entity': 'utils/entity.js',
    'utils/inflect': 'utils/inflect.js',
    'utils/mware': 'utils/mware.js',
    'utils/object-hash': 'utils/object-hash.js',
    'utils/path-matcher': 'utils/path-matcher.js',
    'utils/path-to-regexp': 'utils/path-to-regexp.js',
    'utils/properties': 'utils/properties.js',
    'utils/query': 'utils/query.js',
    'utils/registry': 'utils/registry.js',
    'utils/router': 'utils/router.js',
    'utils/string': 'utils/string.js',
  },
  output: {
    libraryTarget: 'umd',
    filename: '[name].js',
    path: path.resolve(cwd, 'lib'),
  },
  externals: [
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
  plugins: baseCommonConfig.plugins
    .filter(p => !p.constructor || !p.constructor.name === 'UglifyJsPlugin')
    .concat([new SourceMapSupport()]),
})

module.exports = process.env.ANALYZE ? nodeConfig : [webConfig, nodeConfig, minifiedWebConfig]
