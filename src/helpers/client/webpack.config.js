const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')

const webConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    output: {
      libraryTarget: 'umd',
      library: 'SkypagerHelpersClient',
    },
    entry: {
      'skypager-helpers-client': path.resolve(cwd, 'src', 'index.js'),
    },
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    output: {
      libraryTarget: 'umd',
      library: 'SkypagerHelpersClient',
    },
    externals: [
      {
        '@skypager/runtime': {
          commonjs2: 'commonjs2 @skypager/runtime',
          commonjs: 'commonjs @skypager/runtime',
          umd: 'commonjs @skypager/runtime',
          var: 'global skypager',
        },
      },
    ],
    entry: {
      'skypager-helpers-client.min': path.resolve(cwd, 'src', 'index.js'),
    },
  }
)

const nodeConfig = merge(require('@skypager/webpack/config/webpack.config.common'), {
  target: 'node',
  name: 'node',
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
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
  plugins: [new SourceMapSupport()],
})

webConfig.plugins = webConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

nodeConfig.plugins = nodeConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = process.env.ANALYZE ? nodeConfig : [webConfig, nodeConfig, minifiedWebConfig]
