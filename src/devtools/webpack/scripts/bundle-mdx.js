process.env.NODE_ENV = 'production'

const runtime = require('@skypager/node').use(require('@skypager/helpers-document'))

const webpack = require('webpack')

const { upperFirst, camelCase, kebabCase } = runtime.stringUtils
const { print, clear, colors } = runtime.cli

let { prefix = `${runtime.currentPackage.name}/` } = runtime.argv

if (prefix === false) {
  prefix = ''
}

async function main() {
  await runtime.mdxDocs.discover()

  print(`Found mdx docs:`)
  print(runtime.mdxDocs.available, 6)

  const compiler = createCompiler()

  const stats = await compiler.runAsync()

  if (stats.hasErrors() || stats.hasWarnings()) {
    print('Compilation had errors')
    console.log(stats.toString({ all: false, errors: true, warnings: true, colors: true }))
  } else {
    print(`Successfully generated a MDX @skypager/document bundle`)
    console.log(stats.toString({ all: false, chunks: true, colors: true }))
  }
}

main()

function createCompiler() {
  const paths = require('../config/paths')

  const config = require('../config/webpack.config')('production', {
    minifyJs: false,
    webpackCache: false,
    htmlPlugin: false,
    localOnly: false,
    minify: false,
    projectType: 'mdxBundle',
    libraryTarget: 'umd',
  })

  config.target = 'node'
  config.output.filename = 'mdx.bundle.js'
  config.output.chunkFilename = 'mdx.bundle.chunk-[chunkhash:8].js'
  config.output.library = `${upperFirst(
    camelCase(kebabCase(runtime.currentPackage.name.replace('/', '-').replace('@', '')))
  )}MdxDocs`

  config.externals.push({
    '@skypager/helpers-document': {
      commonjs: '@skypager/helpers-document',
      commonjs2: '@skypager/helpers-document',
      root: 'SkypagerHelpersDocument',
    },
  })
  config.module.rules.unshift({
    test: /index.js$/,
    include: [paths.frameworkIndexJs],
    use: [
      {
        loader: require.resolve('skeleton-loader'),
        options: {
          procedure: () => {
            const mod = `
          import runtime from '@skypager/runtime'
          import * as DocumentHelper from '@skypager/helpers-document'
          runtime.use(DocumentHelper)


          const ctx = {}

          ${runtime.mdxDocs.available
            .map(
              (doc, i) =>
                `import * as doc${i} from '${runtime.pathUtils.relative(
                  paths.appSrc,
                  `${doc}.md`
                )}'`
            )
            .join('\n')}
          ${runtime.mdxDocs.available
            .map((doc, i) => `ctx["${prefix}${doc}"] = doc${i};`)
            .join('\n')} 

          export default runtime.Helper.createMockContext(ctx) 
          `.trim()

            return mod
          },
        },
      },
    ],
  })

  config.entry = {
    mdxDocs: ['@babel/polyfill/noConflict', paths.frameworkIndexJs],
  }

  const compiler = webpack(config)

  return {
    ...compiler,
    runAsync: () =>
      new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          err ? reject(err) : resolve(stats)
        })
      }),
  }
}
