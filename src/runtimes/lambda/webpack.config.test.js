const merge = require('webpack-merge')
const config = require('./webpack.config')

module.exports = merge(config, {
  devtool: '#cheap-module-eval-source-map',
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
  },
})
