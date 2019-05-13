const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')

const nodeConfig = merge(
  require('@skypager/webpack/config/webpack.config')('production'),
  {
    context: cwd,
    target: 'node',
    name: 'node',
    devtool: 'inline-cheap-module-source-map',
    entry: {
      index: path.resolve(cwd, 'src', 'index.js'),
    },
    output: {
      libraryTarget: 'commonjs2',
      filename: '[name].js',
      path: path.resolve(cwd, 'lib'),
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
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
