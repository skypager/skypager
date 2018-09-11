const defaultBabelConfig = {
  presets: ['stage-0', 'react'],
  plugins: ['transform-decorators-legacy', 'transform-object-rest-spread'],
}

export default (async function readFileAsts(chain, options = {}) {
  const babelTransformer = __non_webpack_require__('skypager-document-types-babel')
  const markdownTransformer = __non_webpack_require__('skypager-document-types-markdown')
  const { pathMatcher } = require('@skypager/runtime/lib/utils/path-matcher')

  const runtime = this

  const {
    babelConfig = defaultBabelConfig,
    babel = true,
    markdown = true,
    include = [],
    exclude = [
      /.log$/,
      /logs/,
      /.lock/,
      /node_modules/,
      /secrets/,
      /\.env/,
      /vendor/,
      /public\/.*\.\w+$/,
      /\.min\.js$/,
    ],
    extensions = [],
    rootNode,
    props = [],
  } = options

  const transforms = {
    js: (content, o = {}) =>
      babelTransformer.toAST(content, {
        ...this.lodash.defaultsDeep(
          {},
          this.lodash.pick(options, 'presets', 'plugins'),
          babelConfig
        ),
        ...o,
      }),
    md: (content, o = {}) =>
      markdownTransformer.toAST(content, {
        ...this.lodash.pick(options, 'profile', 'method', 'parser'),
        ...o,
      }),
    ...options.transforms,
  }

  const { javascript = babel } = options

  await this.fileManager.startAsync()

  if (!include.length) {
    if (javascript || babel) {
      extensions.push('js', 'es6', 'jsx')
    }

    if (markdown) {
      extensions.push('md', 'mkd', 'markdown')
    }

    include.push(new RegExp(`\.(${extensions.join('|')})$`))
  }

  if (rootNode) {
    include.push(this.resolve(rootNode))
  }

  // console.log('Reading Content', include, exclude)
  await this.fileManager.readContent({ ...options, include, exclude })
  // console.log('Hashing Files')
  await this.fileManager.hashFiles({ ...options, include, exclude })
  // console.log('Selecting Matches')
  const results = await this.fileManager.selectMatches({ exclude, rules: include, fullPath: true })

  const { cloneDeep } = this.lodash

  // console.log('Got Results', results.count)
  const transform = (content, transformId, fileId) => {
    const fn = transforms[transformId]

    if (typeof fn !== 'function') {
      throw new Error(`Invalid transform for ${transformId}`)
    }

    try {
      return cloneDeep(fn(content, options[`${transformId}Options`] || {}))
    } catch (error) {
      if (options.debug) {
        runtime.error(`Error generating ast for ${fileId}`, {
          message: error.message,
          fileId,
          transformId,
          options,
        })
      }

      return { error: true, fileId, transformId, message: error.message, stack: error.stack }
    }
  }

  return chain
    .plant(results)
    .keyBy('relative')
    .pickBy(file => {
      const pass = !exclude.length || !pathMatcher(exclude, file.path)

      if (!pass) {
        // console.log('Rejecting ' + file.path)
      }

      return !!pass
    })
    .mapValues((file, id) => {
      // TODO: Check the hash and dont generate the ast if it exists already
      const { ast, hash, astHash, content, extension } = file

      // console.log('Bilding AST For ', file.path, file.stats.size)
      if (ast && hash && astHash && hash === astHash) {
        file.ast = ast
      } else {
        file.ast = transform(content, extension.replace('.', ''), file.relative)
        file.astHash = hash
      }

      this.fileManager.files.set(file.relative, file)

      const response = props.length ? runtime.lodash.pick(file, props) : file

      return options.map ? options.map(response) : response
    })
    .thru(astMap => {
      return options.debug
        ? {
            getResults: () => results,
            count: results.length,
            astMap,
            fileIds: results.map(r => r.relative),
            include,
            exclude,
            rootNode,
          }
        : astMap
    })
})
