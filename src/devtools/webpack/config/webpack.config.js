const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const resolve = require('resolve')
const PnpWebpackPlugin = require('pnp-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const safePostCssParser = require('postcss-safe-parser')
const ManifestPlugin = require('webpack-manifest-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const WorkboxWebpackPlugin = require('workbox-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent')
const getClientEnvironment = require('./env')
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
const DashboardPlugin = require('webpack-dashboard/plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin-alt')
const typescriptFormatter = require('react-dev-utils/typescriptFormatter')
const mapValues = require('lodash/mapValues')
const pick = require('lodash/pick')
const isEmpty = require('lodash/isEmpty')
const runtime = require('@skypager/node')
const hashObject = require('node-object-hash')
const SkypagerSocketPlugin = require('../plugins/skypager-socket-plugin')

const { WEBPACK_CACHE_MAX_MB = '75', WEBPACK_CACHE_MAX_DAYS = '3' } = process.env

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function(webpackEnv, options = {}) {
  const currentProject =
    typeof options.currentProject === 'object'
      ? options.currentProject
      : require('../current-project')

  const { projectConfig = currentProject.config, projectType = projectConfig.projectType } = options

  const paths = {
    ...require('./paths'),
    ...(projectConfig.paths || {}),
    ...(options.paths || {}),
  }

  const argv = { ...currentProject.argv, ...options }

  // style files regexes
  const cssRegex = /\.css$/
  const cssModuleRegex = /\.module\.css$/
  const sassRegex = /\.(scss|sass)$/
  const lessRegex = /\.less$/
  const sassModuleRegex = /\.module\.(scss|sass)$/
  const mdxRegex = /\.(md|mdx)$/

  const isEnvDevelopment = webpackEnv === 'development'
  const isEnvProduction = webpackEnv === 'production'

  /**
   * See config/flags.js or scripts/build.js for information about
   * setting these flags through --command-line-flags or process.ENV_VARIABLES
   */
  const {
    includeUnminified,
    useServiceWorker,
    shouldRequireLocalFolder,
    shouldMinifyJS,
    shouldMinifyHtml,
    shouldUseRelativeAssetPaths,
    publicUrl,
    publicPath,
    staticOutputPrefix,
    cssFilename,
    cssChunkFilename,
    useTypeScript,
    shouldInlineRuntimeChunk,
    shouldUseSourceMap,
    babelCacheDirectory,
    terserCacheDirectory,
    hardSourceCacheDirectory,
    useWebpackCache,
    maxAge = parseInt(WEBPACK_CACHE_MAX_DAYS, 10) * 24 * 60 * 60 * 1000,
    sizeThreshold = parseInt(WEBPACK_CACHE_MAX_MB, 10) * 1024 * 1024,

    // move these to flags if we end up keeping them
    useExternals = argv.externals !== false && !argv.noExternals,

    // experimental
    useWebpackDashboard = argv.dashboard,

    useSocketPlugin = !!(argv.socketPlugin || process.env.SKYPAGER_SOCKET_PLUGIN),
  } = require('./flags')(currentProject, webpackEnv, options)

  // We automatically include html-webpack-plugin for every index.html found in the root of the public folder
  const htmlPlugins = currentProject.htmlTemplates.map(templatePath =>
    createHtmlPlugin(templatePath, shouldMinifyHtml, currentProject)
  )

  // Get environment variables to inject into our app.
  const env = getClientEnvironment(publicUrl)

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const extractCssOptions = Object.assign(
      {},
      shouldUseRelativeAssetPaths ? { publicPath: './' } : undefined
    )

    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: extractCssOptions,
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          // Necessary for external CSS imports to work
          // https://github.com/facebook/create-react-app/issues/2677
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }),
          ],
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean)

    if (preProcessor) {
      loaders.push({
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      })
    }

    return loaders
  }

  /**
   * Dynamic / Async function which generates the webpack config entry
   */
  function entry({ config = {} } = {}) {
    const appIndexExists = fs.existsSync(paths.appIndexJs)
    const frameworkIndexExists = fs.existsSync(paths.frameworkIndexJs)

    if (!frameworkIndexExists && !appIndexExists) {
      console.error(
        `Missing a valid entry point.  Looked for ${path.relative(
          paths.appPath,
          paths.appIndexJs
        )} or ${path.relative(paths.appPath, paths.frameworkIndexJs)}`
      )
      process.exit(1)
    }

    const appEntry = [
      isEnvDevelopment && require.resolve('react-dev-utils/webpackHotDevClient'),
      paths.appIndexJs,
      // We include the app code last so that if there is a runtime error during
      // initialization, it doesn't blow up the WebpackDevServer client, and
      // changing JS code would still trigger a refresh.
    ].filter(Boolean)

    const appName = argv.appName || currentProject.config.appName || 'app'
    const frameworkEntry = paths.frameworkIndexJs
    const frameworkName = argv.frameworkName || currentProject.config.frameworkName || 'index'
    const excludeApp = !!(argv.noApp === true || argv.app === false || argv.frameworkOnly)
    const excludeFramework = !!(
      argv.noFramework === true ||
      argv.framework === false ||
      argv.appOnly
    )

    const base = {
      ...(appIndexExists && !excludeApp && { [appName]: appEntry }),
      ...(frameworkIndexExists && !excludeFramework && { [frameworkName]: frameworkEntry }),
      ...mapValues(config.entry || {}, value =>
        typeof value === 'string' ? path.resolve(paths.appPath, value) : value
      ),
    }

    if (includeUnminified) {
      Object.keys(base).forEach(chunkName => {
        base[`${chunkName}.min`] = base[chunkName]
      })
    }

    return base
  }

  function outputFileConfig() {
    let filename = '[name].js'
    let chunkFilename = isEnvProduction ? '[name].[chunkhash:8].js' : '[name].[hash:8].chunk.js'

    if (projectType === 'webapp') {
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename = isEnvProduction
        ? 'static/js/[name].[chunkhash:8].js'
        : isEnvDevelopment && 'static/js/[name].js'

      // There are also additional JS chunk files if you use code splitting.
      chunkFilename = isEnvProduction
        ? 'static/js/[name].[chunkhash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[id].[name].[chunkhash:8].chunk.js'
    } else if (
      projectType === 'library' ||
      projectType === 'helper' ||
      projectType === 'feature' ||
      projectType === 'runtime'
    ) {
      filename = '[name].js'
    }

    return {
      filename,
      ...(chunkFilename && { chunkFilename }),
    }
  }

  const entryConfig =
    projectType === 'webapp' && isEnvDevelopment
      ? pick(entry(currentProject), 'app')
      : entry(currentProject)

  const externals = currentProject.externals()

  const finalConfig = {
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',

    // Stop compilation early in production
    bail: isEnvProduction,

    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'eval-source-map',

    externals: [].concat(externals).filter(Boolean),

    // let the function we declared above return the value
    entry: entryConfig,

    output: {
      library: currentProject.libraryName,

      ...(currentProject.libraryTarget &&
        currentProject.libraryTarget.length && { libraryTarget: currentProject.libraryTarget }),
      // The build folder.
      path: isEnvProduction ? paths.appBuild : undefined,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,

      // the filename and chunkFilename properties are dynamically determined by the type of project we're building
      ...outputFileConfig(),

      // We inferred the "public path" (such as / or /my-project) from homepage.
      // We use "/" in development.
      publicPath: publicPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        : isEnvDevelopment && (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        shouldMinifyJS &&
          new TerserPlugin({
            ...(includeUnminified && {
              chunkFilter: chunk => String(chunk.name).match(/\.min/) && entryConfig[chunk.name],
            }),
            terserOptions: {
              parse: {
                // we want terser to parse ecma 8 code. However, we don't want it
                // to apply any minfication steps that turns valid ecma 5 code
                // into invalid ecma 5 code. This is why the 'compress' and 'output'
                // sections only apply transformations that are ecma 5 safe
                // https://github.com/facebook/create-react-app/pull/4234
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                // Disabled because of an issue with Uglify breaking seemingly valid code:
                // https://github.com/facebook/create-react-app/issues/2376
                // Pending further investigation:
                // https://github.com/mishoo/UglifyJS2/issues/2011
                comparisons: false,
                // Disabled because of an issue with Terser breaking valid code:
                // https://github.com/facebook/create-react-app/issues/5250
                // Pending futher investigation:
                // https://github.com/terser-js/terser/issues/120
                inline: 2,
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                // Turned on because emoji and regex is not minified properly using default
                // https://github.com/facebook/create-react-app/issues/2488
                ascii_only: true,
              },
            },
            // Use multi-process parallel running to improve the build speed
            // Default number of concurrent runs: os.cpus().length - 1
            parallel: true,
            // Enable file caching
            cache: terserCacheDirectory,
            sourceMap: shouldUseSourceMap,
          }),
        // This is only used in production mode
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  // `inline: false` forces the sourcemap to be output into a
                  // separate file
                  inline: false,
                  // `annotation: true` appends the sourceMappingURL to the end of
                  // the css file, helping the browser find the sourcemap
                  annotation: true,
                }
              : false,
          },
        }),
      ].filter(Boolean),

      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      ...(projectType === 'webapp' && {
        splitChunks: { chunks: 'all', name: !isEnvProduction },
      }),
      // Keep the runtime chunk separated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      runtimeChunk:
        projectType === 'webapp' && isEnvProduction
          ? { name: entrypoint => `runtime~${entrypoint.name}` }
          : false,
    },
    resolve: {
      aliasFields: ['browser'],

      // This allows you to set a fallback for where Webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebook/create-react-app/issues/253
      modules: [paths.appSrc, 'node_modules'].concat(
        // It is guaranteed to exist because we tweak it in `env.js`
        process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
      ),
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`)
        .filter(ext => useTypeScript || !ext.includes('ts')),

      alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
        // a project can alias their own modules by defining a moduleAliases property in package.json skypager.moduleAliases
        ...(currentProject.moduleAliases || {}),
      },
      plugins: [
        // Adds support for installing with Plug'n'Play, leading to faster installs and adding
        // guards against forgotten dependencies and such.
        PnpWebpackPlugin,
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        shouldRequireLocalFolder && new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
      ].filter(Boolean),
    },
    resolveLoader: {
      plugins: [
        // Also related to Plug'n'Play, but this time it tells Webpack to load its loaders
        // from the current package.
        PnpWebpackPlugin.moduleLoader(currentProject.currentModule),
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },

        // First, run the linter.
        // It's important to do this before Babel processes the JS.
        /*
        {
          test: /\.(js|mjs|jsx)$/,
          enforce: 'pre',
          use: [
            {
              options: {
                formatter: require.resolve('react-dev-utils/eslintFormatter'),
                eslintPath: require.resolve('eslint'),
              },
              loader: require.resolve('eslint-loader'),
            },
          ],
          include: paths.appSrc,
        },
        */
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: 10000,
                name: `${staticOutputPrefix}[name].[hash:8].[ext]`,
              },
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),

                plugins: [
                  [
                    require.resolve('babel-plugin-named-asset-import'),

                    {
                      loaderMap: {
                        svg: {
                          ReactComponent: '@svgr/webpack?-svgo![path]',
                        },
                      },
                    },
                  ],

                  require.resolve('@babel/plugin-syntax-dynamic-import'),
                  require.resolve('@babel/plugin-proposal-class-properties'),
                  [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],

                  isEnvDevelopment && require.resolve('react-hot-loader/babel'),
                ].filter(Boolean),
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: babelCacheDirectory,
                cacheCompression: isEnvProduction,
                compact: isEnvProduction,
              },
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [require.resolve('babel-preset-react-app/dependencies'), { helpers: true }],
                ],
                cacheDirectory: babelCacheDirectory,
                cacheCompression: isEnvProduction,

                // If an error happens in a package, it's possible to be
                // because it was compiled. Thus, we don't want the browser
                // debugger to show the original code. Instead, the code
                // being evaluated would be much more helpful.
                sourceMaps: false,
              },
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                modules: true,
                getLocalIdent: getCSSModuleLocalIdent,
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                },
                'sass-loader'
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 2,
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  modules: true,
                  getLocalIdent: getCSSModuleLocalIdent,
                },
                'sass-loader'
              ),
            },

            !isEmpty(paths.lessModulePaths) && {
              test: lessRegex,
              include: paths.lessModulePaths,
              exclude: [projectType === 'theme' && /semantic\.less$/].filter(Boolean),
              use: getStyleLoaders(
                {
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  importLoaders: 1,
                  modules: true,
                  getLocalIdent: getCSSModuleLocalIdent,
                },
                'less-loader'
              ),
            },

            {
              test: lessRegex,
              use: getStyleLoaders(
                {
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                },
                'less-loader'
              ),
            },

            {
              test: mdxRegex,
              include: [paths.appSrc],
              exclude: [/node_modules/],
              use: [
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    customize: require.resolve('babel-preset-react-app/webpack-overrides'),

                    plugins: [
                      [
                        require.resolve('babel-plugin-named-asset-import'),

                        {
                          loaderMap: {
                            svg: {
                              ReactComponent: '@svgr/webpack?-svgo![path]',
                            },
                          },
                        },
                      ],

                      require.resolve('@babel/plugin-syntax-dynamic-import'),
                      require.resolve('@babel/plugin-proposal-class-properties'),
                      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],

                      isEnvDevelopment && require.resolve('react-hot-loader/babel'),
                    ].filter(Boolean),
                    // This is a feature of `babel-loader` for webpack (not Babel itself).
                    // It enables caching results in ./node_modules/.cache/babel-loader/
                    // directory for faster rebuilds.
                    cacheDirectory: babelCacheDirectory,
                    cacheCompression: isEnvProduction,
                    compact: isEnvProduction,
                  },
                },
                {
                  loader: require.resolve('@skypager/helpers-mdx/loader'),
                },
              ],
            },

            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              loader: require.resolve('file-loader'),
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [
                /\.(js|mjs|jsx|ts|tsx)$/,
                /\.html$/,
                /\.json$/,
                /\.config$/,
                /\.variables$/,
                /\.overrides$/,
              ],
              options: {
                name: `${staticOutputPrefix}[name].[hash:8].[ext]`,
              },
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ].filter(Boolean),
        },
      ],
    },
    plugins: [
      ...htmlPlugins,

      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      isEnvProduction &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
      // In production, it will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      // In development, this will be an empty string.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // This is necessary to emit hot updates (currently CSS only):
      isEnvDevelopment && new webpack.HotModuleReplacementPlugin(),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // If you require a missing module and then `npm install` it, you still have
      // to restart the development server for Webpack to discover it. This plugin
      // makes the discovery automatic so you don't have to restart.
      // See https://github.com/facebook/create-react-app/issues/186
      isEnvDevelopment && new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: cssFilename || 'static/css/[name].[contenthash:8].css',
          chunkFilename: cssChunkFilename || 'static/css/[name].[contenthash:8].chunk.css',
        }),
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: publicPath,
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      isEnvProduction &&
        useServiceWorker &&
        new WorkboxWebpackPlugin.GenerateSW({
          clientsClaim: true,
          exclude: [/\.map$/, /asset-manifest\.json$/],
          importWorkboxFrom: 'cdn',
          navigateFallback: publicUrl + '/index.html',
          navigateFallbackBlacklist: [
            // Exclude URLs starting with /_, as they're likely an API call
            new RegExp('^/_'),
            // Exclude URLs containing a dot, as they're likely a resource in
            // public/ and not a SPA route
            new RegExp('/[^/]+\\.[^/]+$'),
          ],
        }),
      // TypeScript type checking
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          typescript: resolve.sync('typescript', {
            basedir: paths.appNodeModules,
          }),
          async: false,
          checkSyntacticErrors: true,
          tsconfig: paths.appTsConfig,
          compilerOptions: {
            module: 'esnext',
            moduleResolution: 'node',
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'preserve',
          },
          reportFiles: [
            '**',
            '!**/*.json',
            '!**/__tests__/**',
            '!**/?(*.)(spec|test).*',
            '!**/src/setupProxy.*',
            '!**/src/setupTests.*',
          ],
          watch: paths.appSrc,
          silent: true,
          formatter: typescriptFormatter,
        }),

      useWebpackCache &&
        new HardSourceWebpackPlugin({
          // Either an absolute path or relative to webpack's options.context.
          cacheDirectory: hardSourceCacheDirectory,
          // Either a string of object hash function given a webpack config.
          configHash: function(webpackConfig) {
            // node-object-hash on npm can be used to build this.
            return hashObject({ sort: false }).hash({
              ...(runtime.argv.cacheBuster && { cacheBuster: runtime.argv.cacheBuster }),
              ...webpackConfig,
            })
          },
          // Either false, a string, an object, or a project hashing function.
          environmentHash: {
            root: currentProject.paths.appPath,
            directories: [],
            files: [
              currentProject.paths.appPackageJson,
              currentProject.resolvePortfolioPath('yarn.lock'),
            ],
          },
          // An object.
          info: {
            // 'none' or 'test'.
            mode: 'none',
            // 'debug', 'log', 'info', 'warn', or 'error'.
            level: 'debug',
          },
          // Clean up large, old caches automatically.
          cachePrune: {
            maxAge,
            sizeThreshold,
          },
        }),

      // Experimenting with a workaround for a bug in hard-source-webpack-plugin with less files
      // These exclusions end up making the cache almost useless
      useWebpackCache &&
        projectType === 'theme' &&
        new HardSourceWebpackPlugin.ExcludeModulePlugin([
          {
            test: /css-loader.*postcss-loader.*styling.*semantic\.less$/,
          },
        ]),

      useWebpackCache &&
        new HardSourceWebpackPlugin.ExcludeModulePlugin([
          {
            // HardSource works with mini-css-extract-plugin but due to how
            // mini-css emits assets, assets are not emitted on repeated builds with
            // mini-css and hard-source together. Ignoring the mini-css loader
            // modules, but not the other css loader modules, excludes the modules
            // that mini-css needs rebuilt to output assets every time.
            test: /mini-css-extract-plugin[\\/]dist[\\/]loader/,
          },
        ]),

      useWebpackDashboard && new DashboardPlugin(),

      // This is a fork of DashboardPlugin that uses the skypager ipc socket
      // instead of websockets.
      useSocketPlugin &&
        new SkypagerSocketPlugin({
          runtime: currentProject.runtime,
        }),
    ].filter(Boolean),
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false,
  }

  return finalConfig
}

function createHtmlPlugin(template, minify = true, currentProject = require('../current-project')) {
  const filename = require('path').basename(template)

  return new HtmlWebpackPlugin(
    Object.assign(
      {},
      {
        inject: true,
        filename,
        template,
        chunks: [currentProject.config.appName || 'app'],
      },
      minify
        ? {
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
          }
        : undefined
    )
  )
}
