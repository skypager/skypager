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

module.exports = process.env.ANALYZE ? webConfig : [webConfig, minifiedWebConfig]
