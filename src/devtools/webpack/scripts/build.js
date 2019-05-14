// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

// Do this for our js based babelrc to tell which config to use based on the build task being run
process.env.BUILD_ENV = process.env.BUILD_ENV || 'build-umd'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err
})

// Ensure environment variables are read.
require('../config/env')

const path = require('path')
const chalk = require('react-dev-utils/chalk')
const fs = require('fs-extra')
const webpack = require('webpack')
const bfj = require('bfj')
const configFactory = require('../config/webpack.config')
const paths = require('../config/paths')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const FileSizeReporter = require('react-dev-utils/FileSizeReporter')
const printBuildError = require('react-dev-utils/printBuildError')
const BuildCachePlugin = require('../plugins/build-cache-plugin')
const merge = require('webpack-merge')
const { isArray } = require('lodash')

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild
const useYarn = fs.existsSync(paths.yarnLockFile)

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

const isInteractive = process.stdout.isTTY

const currentProject = require('../current-project')
const { argv, config: projectConfig } = currentProject

// Process CLI arguments
const writeStatsJson = argv.stats
const debugConfig = argv.debugConfig
const shouldCleanPreviousBuild =
  process.env.NO_CLEAN !== 'false' && argv.clean !== false && argv.noClean !== true

const shouldCopyPublic = String(argv.copyPublic) !== 'false' && argv.noCopyPublic !== true

async function loadConfig() {
  // Generate configuration
  let config = configFactory('production')

  if (projectConfig.webpacks) {
    const { merge: shouldMerge = true, build } = projectConfig.webpacks

    if (build && String(shouldMerge) !== 'false') {
      const mergeConfig = require(currentProject.resolve(build))
      config = merge(config, mergeConfig)
    }
  }

  // Generates an info file in the build folder.  This info file will have the sourceHash
  // of the project source at the time the project was built.  If they're the same, then there
  // is probably no reason to build the whole project again.
  if (!isArray(config)) {
    config.plugins.push(new BuildCachePlugin({ currentProject }))
  }

  if (currentProject.argv.progress) {
    config.plugins.push(
      new webpack.ProgressPlugin((percent, msg) => {
        console.log(`${msg} ${percent}`)
      })
    )
  }

  const { entry: entryConfig, output, externals } = config

  if (debugConfig) {
    console.log('Project Config')
    console.log(JSON.stringify(currentProject.config, null, 2))
    console.log('Flags', require('../config/flags')(currentProject, 'production'))
    console.log('Entry Config:')
    console.log(JSON.stringify(entryConfig, null, 2))
    console.log('Output Config:')
    console.log(JSON.stringify(output, null, 2))
    console.log('Externals:')
    console.log(JSON.stringify(externals, null, 2))

    process.exit(0)
  }

  return config
}

// We require that you explicitly set browsers and do not fall back to
// browserslist defaults.
const { checkBrowsers } = require('react-dev-utils/browsersHelper')

function displayHelp() {
  const { colors, clear, randomBanner } = require('@skypager/node').cli
  clear()
  randomBanner('Skypager')

  const message = `
  ${colors.bold.underline('@skypager/webpack build script')}

  This script will generate a webpack build.
  
  The following options are for advanced use cases, and generally will be taken care of automatically for you
  based on the type of project you're building.  
 
  ${colors.bold.underline('Available Options')}

  --force                       build the project even if the sourceHash from the last build still matches.
  --no-clean                    don't remove the previous build folder, just overwrite it.
  --stats                       generate a webpack stats.json in the build folder
  --debug-config                view the webpack config and exit.
  --no-html                     disable the html-webpack-plugin completely.
  --no-local-only               disable the restriction only importing modules from the project's src
  --no-minify-js                disable js minification 
  --no-minify-html              disable html minification in the html-webpack plugin

  ${colors.bold.underline('Entry / Output Options')}

  --app-name                    the name of the output file for the app entry point. (src/launch.js)
  --framework-name              the name of the output file for the framework entry point. (src/index.js)
  --app-only, --no-framework    only build the application entry point
  --framework-only, --no-app    only build the framework entry point  

  --library-target              which libraryTarget to use in webpack output config
  --library-name                for umd builds, which global variable to put this module in. 

  --css-filename                output file name for the extracted css bundle.
  --include-uncompressed        build separate minified and unminified files for each entry point.
  --no-source-maps              disable source maps

  ${colors.bold.underline('Caching Options')}

  --no-cache                    disable any type of caching (babel, terser, hard-source webpack)
  --no-babel-cache              disable babel-loader cache
  --no-terser-cache             disable terser js minification cache
  --no-webpack-cache            disable hard-source-webpack-plugin caching
  --reset-cache                 delete the hard-source-webpack plugin cache
  --cache-buster='string'       specify a random string to invalidate the webpack cache                 
  
  ${colors.bold.underline('Asset Caching Options')}

  --use-service-worker          on by default for webapp project types, uses the workbox service worker plugin
  --use-cdn                     instead of copying assets into the build folder, use their cdn hosted location.

  ${colors.bold.underline('Project Configuration Options')}

  Every skypager project can have a skypager config property in their package.json.  The webpack config behavior will
  look for the following keys:

  libraryTarget
  libraryName
  frameworkName
  appName
  cssFilename
  cssChunkFilename
  projectType

  Generally these match up with some of the process.argv --flags with different casing.  When supplied via process.argv,
  those values will take precedence over the package.json config

  ${colors.bold.underline('Project Types')}

  Based on the project type different options may be turned on by default.  For example, we want to use the service worker 
  plugin by default for all webapp project types.

  ${colors.bold.underline('Custom Webpack Config Files')}

  In the skypager package config, you can supply something like:

  "webpack": {
    "build": "webpack.config.js",
    "start": "webpack.config.js",
    "merge": false 
  }

  merge is true by default, if you pass false you will be 100% responsible for webpack config.

  when merge is on, the webpack.config you export will be merged into the one we generate by default using webpack-merge from npm.

  ${colors.bold.underline('Environment Variables')}

  CI                            set to true to be in ci mode 
  PORTFOLIO_CACHE_DIRECTORY     setting this path to outside of the git repo will give you a persistent cache
  BABEL_CACHE_DIRECTORY         set this to use a different path than $PORTFOLIO_CACHE_DIRECTORY/babel
  TERSER_CACHE_DIRECTORY        set this to use a different path than $PORTFOLIO_CACHE_DIRECTORY/terser 
  WEBPACK_CACHE_DIRECTORY       set this to use a different path than $PORTFOLIO_CACHE_DIRECTORY/webpack 
  DISABLE_WEBPACK_CACHING       set to true to disable webpack caching 
  MINIFY_HTML                   set to false to disable
  MINIFY_JS                     set to false to disable
  GENERATE_SOURCEMAP            set to false to disable
  DISABLE_HTML_PLUGIN           set to true to disable
  DISABLE_MODULE_SCOPE_PLUGIN   set to true to disable local source requirement
  REQUIRE_LOCAL_SOURCE          same as setting above to true
  USE_SERVICE_WORKER            set to true to enable service worker, or false to disable it for webapps
  NO_CLEAN                      set to true to prevent cleaning previous build
  INLINE_RUNTIME_CHUNK          set to false to disable inline of webpack runtime in html for webapps
  `

  console.log(message)
}

if (process.argv.indexOf('--help') !== -1 || process.argv.indexOf('help') !== -1) {
  displayHelp()
  process.exit(0)
} else if (require.main === module) {
  main()
}

async function main() {
  checkBrowsers(paths.appPath, isInteractive)
    .then(() => (currentProject.argv.force ? true : currentProject.checkForExistingBuild()))
    .then(buildRequired => {
      if (!buildRequired) {
        console.log('This project has already been built.  Pass --force to build anyway.')
        process.exit(0)
      }
      return true
    })
    .then(() => currentProject.checkCache())
    .then(() => {
      // First, read the current file sizes in build directory.
      // This lets us display how much they changed later.
      return measureFileSizesBeforeBuild(paths.appBuild)
    })
    .then(previousFileSizes => {
      // Remove all content but keep the directory so that
      // if you're in it, you don't end up in Trash
      shouldCleanPreviousBuild && fs.emptyDirSync(paths.appBuild)
      // Merge with the public folder

      try {
        shouldCopyPublic && copyPublicFolder()
      } catch (error) {}

      // Start the webpack build
      return loadConfig().then(config => build(previousFileSizes, config))
    })
    .then(
      ({ stats, previousFileSizes, warnings, config }) => {
        if (warnings.length) {
          console.log(chalk.yellow('Compiled with warnings.\n'))
          console.log(warnings.join('\n\n'))
          console.log(
            '\nSearch for the ' +
              chalk.underline(chalk.yellow('keywords')) +
              ' to learn more about each warning.'
          )
          console.log(
            'To ignore, add ' + chalk.cyan('// eslint-disable-next-line') + ' to the line before.\n'
          )
        }

        if (currentProject.argv.printStats) {
          console.log(
            stats.toString({
              colors: true,
            })
          )
          return
        }

        const buildFolder = path.relative(process.cwd(), paths.appBuild)

        if (currentProject.argv.saveStats) {
          currentProject.runtime.fsx.writeJsonSync(
            path.resolve(buildFolder, 'stats.json'),
            stats.toJson({
              source: false,
            })
          )
        }

        const appPackage = require(paths.appPackageJson)
        const publicUrl = paths.publicUrl
        const publicPath = config.output.publicPath
        currentProject.printHostingInstructions(
          appPackage,
          publicUrl,
          publicPath,
          buildFolder,
          useYarn
        )
        console.log('File sizes after gzip:\n')
        printFileSizesAfterBuild(
          stats,
          previousFileSizes,
          paths.appBuild,
          WARN_AFTER_BUNDLE_GZIP_SIZE,
          WARN_AFTER_CHUNK_GZIP_SIZE
        )
        console.log()
      },
      err => {
        console.log(chalk.red('Failed to compile.\n'))
        console.log(err.stack)
        printBuildError(err)
        process.exit(1)
      }
    )
    .catch(err => {
      if (err && err.message) {
        console.log(err.message)
      }
      process.exit(1)
    })
}

// Create the production build and print the deployment instructions.
async function build(previousFileSizes, config) {
  await currentProject.projectTypeHooks.beforeBuild(config)

  let compiler = webpack(config)

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages
      if (err) {
        if (!err.message) {
          return reject(err)
        }
        messages = formatWebpackMessages({
          errors: [err.message],
          warnings: [],
        })
      } else {
        messages = formatWebpackMessages(stats.toJson({ all: false, warnings: true, errors: true }))
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1
        }
        return reject(new Error(messages.errors.join('\n\n')))
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
              'Most CI servers set it automatically.\n'
          )
        )
        return reject(new Error(messages.warnings.join('\n\n')))
      }

      const resolveArgs = {
        stats,
        previousFileSizes,
        warnings: messages.warnings,
        config,
      }

      if (writeStatsJson) {
        return bfj
          .write(paths.appBuild + '/bundle-stats.json', stats.toJson())
          .then(() => resolve(resolveArgs))
          .catch(error => reject(new Error(error)))
      }

      return resolve(resolveArgs)
    })
  })
}

/**
 * Copies everything from the public folder to the build folder,
 * with the exception of the index.html, index.dev.html, etc
 */
function copyPublicFolder() {
  if (!fs.existsSync(paths.appPublic)) {
    return
  }

  const { basename } = require('path')
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => {
      const filename = basename(file)
      return !(filename.startsWith('index') && filename.endsWith('.html'))
    },
  })
}

async function resetCache(
  { babelCacheDirectory, terserCacheDirectory, hardSourceCacheDirectory },
  runtime
) {
  await Promise.all([
    runtime.fsx.removeAsync(babelCacheDirectory).catch(() => false),
    runtime.fsx.removeAsync(terserCacheDirectory).catch(() => false),
    runtime.fsx.removeAsync(hardSourceCacheDirectory).catch(() => false),
  ])

  process.exit(0)
}
