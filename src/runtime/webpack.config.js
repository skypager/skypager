const merge = require('webpack-merge')
const cwd = __dirname
const path = require('path')

const baseProductionConfig = require('@skypager/webpack/config/webpack.config')('production')

const minifiedWebConfig = merge.strategy({ node: 'replace', entry: 'replace' })(
  baseProductionConfig,
  {
    name: 'web',
    node: {
      process: 'mock',
      global: false,
    },
    output: {
      library: 'skypager',
      libraryTarget: 'umd',
    },
    resolve: {
      alias: {
        lodash: require.resolve('lodash/lodash.min.js'),
        mobx: path.resolve(cwd, 'src', 'mobx.umd.min.js'),
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtime.min': [
        '@babel/polyfill/noConflict',
        path.resolve(cwd, 'src', 'index.web.js'),
      ],
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
    output: {
      library: 'skypager',
      libraryTarget: 'umd',
    },
    resolve: {
      alias: {
        lodash: require.resolve('lodash/lodash.min.js'),
        mobx: path.resolve(cwd, 'src', 'mobx.umd.min.js'),
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtime': ['@babel/polyfill/noConflict', path.resolve(cwd, 'src', 'index.web.js')],
    },
    plugins: baseProductionConfig.plugins.filter(
      p => !p.constructor || !p.constructor.name === 'UglifyJsPlugin'
    ),
  }
)

module.exports = process.env.ANALYZE ? webConfig : [webConfig, minifiedWebConfig]
