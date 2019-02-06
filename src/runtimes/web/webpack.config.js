const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')

const orig = process.env.MINIFY
process.env.MINIFY = true
const baseProductionConfig = require('@skypager/webpack/config/webpack.config.prod')
process.env.MINIFY = orig || false

const minifiedWebConfig = merge.strategy({ node: 'replace', entry: 'replace' })(
  baseProductionConfig,
  {
    name: 'web',
    output: {
      library: 'skypager',
      libraryTarget: 'umd',
    },
    entry: {
      'skypager-runtimes-web.min': path.resolve(cwd, 'src', 'index.js'),
    },
  }
)

const webConfig = merge.strategy({ node: 'replace', entry: 'replace', plugins: 'replace' })(
  baseProductionConfig,
  {
    name: 'web',
    output: {
      library: 'skypager',
      libraryTarget: 'umd',
    },
    entry: {
      'skypager-runtimes-web': path.resolve(cwd, 'src', 'index.js'),
    },
    plugins: baseProductionConfig.plugins.filter(
      p => !p.constructor || !p.constructor.name === 'UglifyJsPlugin'
    ),
  }
)

module.exports = process.env.ANALYZE ? webConfig : [webConfig, minifiedWebConfig]
