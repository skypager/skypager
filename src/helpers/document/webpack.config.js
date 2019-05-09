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
    externals: [
      {
        react: {
          commonjs2: 'react',
          commonjs: 'react',
          umd: 'react',
          var: 'global React',
        },
        'prop-types': {
          commonjs2: 'prop-types',
          commonjs: 'prop-types',
          umd: 'prop-types',
          var: 'global PropTypes',
        },
        '@skypager/runtime': {
          commonjs2: '@skypager/runtime',
          commonjs: '@skypager/runtime',
          umd: '@skypager/runtime',
          var: 'global skypager',
        },
      },
    ],
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
        react: {
          commonjs2: 'react',
          commonjs: 'react',
          umd: 'react',
          var: 'global React',
        },
        'prop-types': {
          commonjs2: 'prop-types',
          commonjs: 'prop-types',
          umd: 'prop-types',
          var: 'global PropTypes',
        },
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

module.exports = webConfig
