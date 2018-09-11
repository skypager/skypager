const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')
const SourceMapSupport = require('webpack-source-map-support')

const webConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    resolve: {
      alias: {
        lodash: require.resolve('lodash/lodash.min.js'),
        mobx: path.resolve(cwd, 'src', 'mobx.umd.min.js'),
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtime': path.resolve(cwd, 'src', 'index.js'),
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
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    resolve: {
      alias: {
        lodash: require.resolve('lodash/lodash.min.js'),
        mobx: path.resolve(cwd, 'src', 'mobx.umd.min.js'),
        vm: 'vm-browserify',
      },
    },
    entry: {
      'skypager-runtime.min': path.resolve(cwd, 'src', 'index.js'),
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
