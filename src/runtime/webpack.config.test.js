const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')
const paths = require('@skypager/webpack/config/paths')

const nodeConfig = merge(
  require('@skypager/webpack/config/webpack.config.builder')({ paths, babel: { lodash: false } }),
  {
    context: cwd,
    target: 'node',
    name: 'node',
    devtool: '#cheap-module-eval-source-map',
    entry: {
      index: path.resolve(cwd, 'src', 'index.js'),
    },
    output: {
      libraryTarget: 'commonjs2',
      filename: '[name].js',
      path: path.resolve(cwd, 'lib'),
      // devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      // devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
    },
    externals: [
      nodeExternals({
        modulesFromFile: true,
      }),
    ],
    plugins: [new SourceMapSupport()],
  }
)

nodeConfig.plugins = nodeConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = nodeConfig
