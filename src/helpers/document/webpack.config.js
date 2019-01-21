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
      library: 'SkypagerHelpersDocument',
    },
    module: {
      rules: [
        {
          test: /discover\.js$/,
          use: [
            {
              loader: 'skeleton-loader',
              options: {
                procedure() {
                  return `module.exports = { discover: () => {} }`
                },
              },
            },
          ],
        },
      ],
    },
    entry: {
      'skypager-helpers-document': path.resolve(cwd, 'src', 'index.web.js'),
    },
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace' })(
  require('@skypager/webpack/config/webpack.config.prod'),
  {
    name: 'web',
    output: {
      libraryTarget: 'umd',
      library: 'SkypagerHelpersDocument',
    },
    externals: [
      {
        '@skypager/runtime': {
          commonjs2: '@skypager/runtime',
          commonjs: '@skypager/runtime',
          umd: '@skypager/runtime',
          var: 'global skypager',
        },
      },
    ],
    entry: {
      'skypager-helpers-document.min': path.resolve(cwd, 'src', 'index.web.js'),
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
    {
      '@skypager/runtime': 'commonjs @skypager/runtime',
      '@babel/preset-env': 'commonjs @babel/preset-env',
      '@babel/plugin-proposal-decorators': '@babel/plugin-proposal-decorators',
      '@babel/plugin-proposal-class-properties': '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from': '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-object-rest-spread': '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-syntax-dynamic-import': '@babel/plugin-syntax-dynamic-import',
    },
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
