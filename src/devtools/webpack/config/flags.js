const fs = require('fs-extra')

module.exports = function getFlags(currentProject, isEnvProduction) {
  const { paths, argv } = currentProject
  const { projectType } = currentProject.config

  const noCache =
    argv.cache === false || argv.noCache || String(process.env.DISABLE_WEBPACK_CACHING) === 'true'

  // Disabling the hard-source-webpack-plugin for themes for now, can still enable it to test with --webpack-cache flag
  const useWebpackCache =
    !noCache &&
    String(process.env.USE_HARD_SOURCE_PLUGIN) !== 'false' &&
    String(argv.webpackCache) !== 'false' &&
    argv.webpackCache

  const babelCacheDirectory =
    noCache || argv.babelCache === false
      ? false
      : process.env.BABEL_CACHE_DIRECTORY || currentProject.resolveCachePath('babel')

  const terserCacheDirectory =
    noCache || argv.terserCache === false
      ? false
      : process.env.TERSER_CACHE_DIRECTORY || currentProject.resolveCachePath('terser')

  const hardSourceCacheDirectory =
    process.env.WEBPACK_CACHE_DIRECTORY ||
    currentProject.resolveCachePath('webpack', currentProject.name.split('/').pop(), '[confighash]')

  const shouldMinifyHtml =
    isEnvProduction &&
    String(process.env.MINIFY_HTML) !== 'false' &&
    String(argv.minifyHtml) !== 'false'

  const shouldMinifyJS =
    isEnvProduction &&
    String(process.env.MINIFY_JS) !== 'false' &&
    String(argv.minifyJs) !== 'false'

  // Projects which attempt to import modules outside their own src folder
  // will receive an error, unless this is disabled in the script environment
  const shouldRequireLocalFolder =
    String(process.env.DISABLE_MODULE_SCOPE_PLUGIN) !== 'false' &&
    String(process.env.REQUIRE_LOCAL_SOURCE) !== 'false' &&
    String(argv.localOnly) !== 'false' &&
    String(currentProject.config.localOnly) !== 'false'

  // For certain types of projects, it helps to distribute minified and unminified versions of the source
  // we'll automatically do this for libraries.
  const includeUnminified = shouldMinifyJS && currentProject.config.includeUnminified

  const useServiceWorker = !!(
    String(process.env.USE_SERVICE_WORKER) === 'true' ||
    argv.useServiceWorker ||
    currentProject.config.useServiceWorker
  )

  // Webpack uses `publicPath` to determine where the app is being served from.
  // It requires a trailing slash, or the file assets will get an incorrect path.
  // In development, we always serve from the root. This makes config easier.
  const publicPath =
    currentProject.config.publicPath ||
    (isEnvProduction ? paths.servedPath : !isEnvProduction && '/')

  // Some apps do not use client-side routing with pushState.
  // For these, "homepage" can be set to "." to enable relative asset paths.
  const shouldUseRelativeAssetPaths =
    projectType === 'helper' ||
    projectType === 'library' ||
    projectType === 'feature' ||
    publicPath === './'

  const staticOutputPrefix = currentProject.config.staticOutputPrefix || 'static/media/'

  const { cssFilename, cssChunkFilename } = currentProject.config

  // `publicUrl` is just like `publicPath`, but we will provide it to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  const publicUrl =
    currentProject.config.publicUrl ||
    (isEnvProduction ? publicPath.slice(0, -1) : !isEnvProduction && '')

  // Source maps are resource heavy and can cause out of memory issue for large source files.
  const shouldUseSourceMap =
    process.env.GENERATE_SOURCEMAP !== 'false' && String(argv.sourceMaps) !== 'false'

  // Some apps do not need the benefits of saving a web request, so not inlining the chunk
  // makes for a smoother build process.
  const shouldInlineRuntimeChunk =
    process.env.INLINE_RUNTIME_CHUNK !== 'false' && projectType === 'webapp'

  const shouldCopyPublic = String(argv.copyPublic) !== 'false'

  // Check if TypeScript is setup
  const useTypeScript = fs.existsSync(paths.appTsConfig)

  return {
    publicPath,
    publicUrl,
    shouldUseSourceMap,
    shouldInlineRuntimeChunk,
    useTypeScript,
    shouldUseRelativeAssetPaths,
    staticOutputPrefix,
    cssFilename,
    cssChunkFilename,
    includeUnminified,
    useServiceWorker,
    shouldRequireLocalFolder,
    shouldMinifyJS,
    shouldMinifyHtml,
    babelCacheDirectory,
    terserCacheDirectory,
    hardSourceCacheDirectory,
    useWebpackCache,
    shouldCopyPublic,
  }
}
