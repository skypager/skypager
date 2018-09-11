const paths = require('./paths')
require('./env')

const manifest = require(paths.appPackageJson)

module.exports = require('./webpack.config.builder')(
  // a project in this portfolio can pass options to the webpack config builder by
  // putting an object in the skypager.webpack property in package.json
  Object.assign({ paths }, manifest.skypager ? manifest.skypager.webpack || {} : {})
)
