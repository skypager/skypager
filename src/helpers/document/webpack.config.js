const merge = require('webpack-merge')
const cwd = __dirname
const path = require('path')

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

webConfig.plugins = webConfig.plugins.filter(
  p => !p.constructor || (p.constructor && p.constructor.name !== 'UglifyJsPlugin')
)

module.exports = [webConfig, minifiedWebConfig]
