const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const cwd = __dirname
const path = require('path')

const webConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    entry: {
      'skypager-runtimes-web': path.resolve(cwd, 'src', 'index.js'),
    },
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    entry: {
      'skypager-runtimes-web.min': path.resolve(cwd, 'src', 'index.js'),
    },
  }
)

const nodeConfig = merge(require('@skypager/webpack/config/webpack.config.prod'), {
  target: 'node',
  name: 'node',
  externals: [
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
})

webConfig.plugins = webConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

nodeConfig.plugins = nodeConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = process.env.ANALYZE ? nodeConfig : [webConfig, nodeConfig, minifiedWebConfig]
