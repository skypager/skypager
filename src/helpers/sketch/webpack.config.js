const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')

const nodeConfig = merge(require('@skypager/webpack/config/webpack.config.common'), {
  target: 'node',
  name: 'node',
  node: false,
  devtool: 'source-map',
  entry: {
    index: path.resolve(cwd, 'src', 'index.js'),
  },
  output: {
    libraryTarget: 'commonjs2',
    filename: '[name].js',
    path: path.resolve(cwd, 'lib'),
  },
  externals: [
    { '@skypager/runtime': 'commonjs2 @skypager/runtime' },
    { '@skypager/features-file-manager': 'commonjs2 @skypager/features-file-manager' },
    { '@skypager/node': 'commonjs2 @skypager/node' },
    { 'child-process-promise': 'commonjs2 child-process-promise' },
    { 'fs-extra-promise': 'commonjs2 fs-extra-promise' },
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
  plugins: [new SourceMapSupport()],
})

nodeConfig.plugins = nodeConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = process.env.ANALYZE ? nodeConfig : nodeConfig
