// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

// Ensure environment variables are read.
require('@skypager/webpack/config/env')

const path = require('path')
const argv = require('minimist')(process.argv.slice(0, 2))
const fs = require('fs-extra')
const webpack = require('webpack')
const config = require('@skypager/webpack/config/webpack.config.prod')
const paths = require('@skypager/webpack/config/paths')
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const get = require('lodash/get')
const isArray = require('lodash/isArray')
const configMerge = require('webpack-merge')

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.frameworkIndexJs])) {
  process.exit(1)
}

const manifest = require(paths.appPackageJson)
console.log(`Building ${manifest.name} v${manifest.version}`)

fs.emptyDirSync(paths.appBuild)
copyPublicFolder()
watch()

// Create the production build and print the deployment instructions.
async function watch() {
  let webpackConfig = config

  if (get(manifest, 'skypager.webpack.build')) {
    let configToMerge = require(path.resolve(
      path.dirname(paths.appPackageJson),
      get(manifest, 'skypager.webpack.build')
    ))

    if (typeof configToMerge === 'function') {
      configToMerge = await Promise.resolve(configToMerge(argv.env || 'production', argv, config))
    }

    if (!isArray(configToMerge)) {
      // we won't try and merge webpack config if it is an array
      webpackConfig = configMerge(webpackConfig, configToMerge)
    }
  }

  const compiler = webpack(webpackConfig)

  compiler.watch({ aggregateTimeout: 1000 }, (err, stats) => {
    if (err) {
      console.error(err)
      return
    }
    const messages = formatWebpackMessages(stats.toJson({}, true))

    if (messages.errors.length) {
      // Only keep the first error. Others are often indicative
      // of the same problem, but confuse the reader with noise.
      if (messages.errors.length > 1) {
        messages.errors.length = 1
      }

      throw new Error(messages.errors.join('\n\n'))
    }
  })
}

function copyPublicFolder() {
  fs.existsSync(paths.appPublic) &&
    fs.copySync(paths.appPublic, paths.appBuild, {
      dereference: true,
      filter: file => file !== paths.appHtml,
    })
}
