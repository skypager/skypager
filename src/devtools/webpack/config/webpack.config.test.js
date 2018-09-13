const merge = require('webpack-merge')
const paths = require('./paths')
const SourceMapSupport = require('webpack-source-map-support')
const nodeExternals = require('webpack-node-externals')
const { DefinePlugin } = require('webpack')
const config = require('./webpack.config.builder')({
  target: 'node',
  paths,
  targets: {
    node: 'current',
  },
  babel: {
    lodash: false,
  },
})

const { name, version } = require(paths.appPackageJson)

config.plugins = config.plugins.filter(p => {
  if (p.constructor && p.constructor.name === 'DefinePlugin' && p.definitions['process.env']) {
    return true
  } else {
    return true
  }
})

const webpackConfig = merge(config, {
  context: paths.appRoot,
  devtool: '#cheap-module-eval-source-map',
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
  },
  externals: [
    {
      '@skypager/node': 'commonjs2 @skypager/node',
      '@skypager/features-file-manager': 'commonjs2 @skypager/features-file-manager',
      watch: 'commonjs2 watch',
      'aws-sdk': 'commonjs2 aws-sdk',
      fsevents: 'commonjs2 fsevents',
    },
    nodeExternals({ modulesFromFile: true }),
    nodeExternals({ modulesFromFile: false, modulesDir: paths.portfolioNodeModules }),
  ],
  plugins: [new SourceMapSupport(), new DefinePlugin({ __PACKAGE__: { name, version } })],
})

module.exports = webpackConfig
