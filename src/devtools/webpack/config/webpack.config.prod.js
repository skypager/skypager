const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const fs = require('fs')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const ManifestPlugin = require('webpack-manifest-plugin')
const configMerge = require('webpack-merge')
const upperFirst = require('lodash/upperFirst')
const camelCase = require('lodash/camelCase')
const mapKeys = require('lodash/mapKeys')

const getClientEnvironment = require('./env')
const paths = require('./paths')
const commonConfig = require('./webpack.config.withPlugins')
const manifest = require(paths.appPackageJson)

// Webpack uses `publicPath` to determine where the app is being served from.
// It requires a trailing slash, or the file assets will get an incorrect path.
const publicPath = paths.servedPath

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false'
const shouldMinify = process.argv.find(i => i === '--minify') || process.env.MINIFY

// `publicUrl` is just like `publicPath`, but we will provide it to our app
// as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
// Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
const publicUrl = publicPath.slice(0, -1)
// Get environment variables to inject into our app.
const env = getClientEnvironment(publicUrl)

// Assert this just to be safe.
// Development builds of React are slow and not intended for production.
// if (env.stringified['process.env'].NODE_ENV !== '"production"') {
//  throw new Error('Production builds must have NODE_ENV=production.')
// }

// Generates an `index.html` file with the <script> injected.
const html = filename =>
  new HtmlWebpackPlugin({
    inject: true,
    filename,
    template: path.resolve(path.dirname(paths.appHtml), filename),
    chunks: ['app'],
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
  })

const hasHtml = fs.existsSync(paths.appHtml)
let htmlPlugins = hasHtml ? [html('index.html')] : []

const availableHtmlFiles = (hasHtml ? fs.readdirSync(path.dirname(paths.appHtml)) : []).filter(f =>
  f.match(/index\.\w+\.html/)
)

if (availableHtmlFiles.length) {
  htmlPlugins = htmlPlugins.concat(availableHtmlFiles.map(filename => html(filename)))
}

const frameworkName = (manifest.skypager && manifest.skypager.frameworkName) || 'index'
const appName = (manifest.skypager && manifest.skypager.appName) || 'app'

let entry = {}

if (fs.existsSync(paths.frameworkIndexJs)) {
  entry[frameworkName] = paths.frameworkIndexJs
}

if (fs.existsSync(paths.appIndexJs)) {
  entry[appName] = paths.appIndexJs
}

if (shouldMinify) {
  entry = mapKeys(entry, (v, k) => `${k}.min`)
}

// This is the production configuration.
// It compiles slowly and is focused on producing a fast and minimal bundle.
// The development configuration is different and lives in a separate file.
const webpackConfig = configMerge(commonConfig, {
  target: 'web',
  // Don't attempt to continue if there are any errors.
  bail: true,
  // We generate sourcemaps in production. This is slow but gives good results.
  // You can exclude the *.map files from the build during deployment.
  devtool: shouldUseSourceMap ? 'source-map' : false,
  // In production, we only want to load the polyfills and the app code.
  entry,
  output: {
    libraryTarget: 'umd',
    library:
      (manifest.skypager && manifest.skypager.libraryName) ||
      `Skypager${upperFirst(camelCase(manifest.name.split('/').pop()))}`,
    // The build folder.
    path: paths.appBuild,
    // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash:8].chunk.js',
    // We inferred the "public path" (such as / or /my-project) from homepage.
    publicPath,
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info =>
      path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/'),
  },
  plugins: [
    // Makes some environment variables available in index.html.
    // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // In production, it will be an empty string unless you specify "homepage"
    // in `package.json`, in which case it will be the pathname of that URL.
    htmlPlugins.length && new InterpolateHtmlPlugin(env.raw),

    ...htmlPlugins,

    // Minify the code.
    shouldMinify &&
      new UglifyJsPlugin({
        cache: true,
        sourceMap: shouldUseSourceMap,
        uglifyOptions: {
          compress: {
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebookincubator/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
          },
          mangle: {
            safari10: true,
            keep_fnames: true,
          },
          output: {
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebookincubator/create-react-app/issues/2488
            ascii_only: true,
          },
        },
      }),

    // Generate a manifest file which contains a mapping of all asset filenames
    // to their corresponding output file so that tools can pick it up without
    // having to parse `index.html`.
    new ManifestPlugin({
      fileName: 'asset-manifest.json',
    }),
    // Add Bundle Analyzer when it's required
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
})

module.exports = webpackConfig
