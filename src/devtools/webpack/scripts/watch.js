// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

const runtime = require('@skypager/node')

function displayHelp() {
  const { colors, clear, randomBanner } = require('@skypager/node').cli
  clear()
  randomBanner('Skypager')

  const message = `
  ${colors.bold.underline('@skypager/webpack watch script')}

  This script is the same as build, but in long running process form.  It will watch your project folder for changes
  and rerun the build.  This is similar to webpack --watch

  The webpack config templates can be found in @skypager/webpack/config.

  For a full list of options, run:

  $ skypager build --help
  `

  console.log(message)
}

if (process.argv.indexOf('--help') !== -1 || process.argv.indexOf('help') !== -1) {
  displayHelp()
  process.exit(0)
} else if (require.main === module) {
  main()
}

function main() {
  // Ensure environment variables are read.
  require('../config/env')

  const fs = require('fs-extra')
  const webpack = require('webpack')
  const config = require('../config/webpack.config')('production')
  const paths = require('../config/paths')
  const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')

  const manifest = require(paths.appPackageJson)
  console.log(`Watching ${manifest.name} v${manifest.version}`)

  if (!runtime.argv.noClean && runtime.argv.clean !== false) {
    fs.emptyDirSync(paths.appBuild)
  }

  try {
    copyPublicFolder()
  } catch (error) {}

  watch()

  // Create the production build and print the deployment instructions.
  function watch() {
    let webpackConfig = config

    webpackConfig.plugins.push({
      apply(compiler) {
        compiler.hooks.invalid.tap('ClearPlugin', () => {
          runtime.cli.clear()
          runtime.cli.print('Change Detected. Recompiling...')
        })
      },
    })

    if (!String(webpackConfig.target).match(/(node|electron)/)) {
      webpackConfig.plugins.unshift(new webpack.IgnorePlugin(/@skypager\/node/))
    }

    const compiler = webpack(webpackConfig)

    compiler.watch({ aggregateTimeout: 400 }, (err, stats) => {
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

        console.log(messages.errors.join('\n\n'))
      } else {
        runtime.cli.clear()
        console.log(stats.toString({ colors: true }))
      }
    })
  }

  function copyPublicFolder() {
    fs.copySync(paths.appPublic, paths.appBuild, {
      dereference: true,
      filter: file => file !== paths.appHtml,
    })
  }
}
