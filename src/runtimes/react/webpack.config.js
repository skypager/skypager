const merge = require('webpack-merge')
const cwd = __dirname
const path = require('path')
const { DefinePlugin } = require('webpack')
const { name, version } = require('./package.json')
const CopyPlugin = require('copy-webpack-plugin')

process.env.MINIFY = true
const baseProdConfig = require('@skypager/webpack/config/webpack.config.prod')

baseProdConfig.externals = [{
  react: 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes'
}]

const webConfig = merge.strategy({ plugins: 'replace', entry: 'replace', node: 'replace' })(
  baseProdConfig,
  {
    name: 'web',
    output: {
      library: 'skypager',
      libraryTarget: 'umd',
      libraryExport: 'default'
    } ,
    node: {
      process: false,
      global: false,
      vm: false,
    },
    entry: {
      'skypager-runtimes-react': path.resolve(cwd, 'src', 'launch.js'),
    },
    plugins: baseProdConfig.plugins
      .filter(p => {
        if (p.constructor && p.constructor.name === 'UglifyJsPlugin') {
          return false
        }

        return true
      })
      .concat([
        new DefinePlugin({
          __PACKAGE__: JSON.stringify({ name, version }),
        }),
      ]),
  }
)

const minifiedWebConfig = merge.strategy({ entry: 'replace', node: 'replace' })(baseProdConfig, {
  name: 'web',
  node: false,
  output: {
    library: 'skypager',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  entry: {
    'skypager-runtimes-react.min': path.resolve(cwd, 'src', 'launch.js'),
  },
  plugins: [
    new DefinePlugin({
      __PACKAGE__: JSON.stringify({ name, version }),
    }),
    new CopyPlugin([{
      from: path.resolve(cwd, 'public', 'App.js')
    }, {
      from: require.resolve('react/umd/react.development.js')
    }, {
      from: require.resolve('react-dom/umd/react-dom.development.js')
    }, {
      from: require.resolve('prop-types/prop-types.min.js')
    }])
  ],
})

module.exports = process.env.ANALYZE ? webConfig : [webConfig, minifiedWebConfig]
