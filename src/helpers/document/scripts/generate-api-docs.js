const runtime = require('@skypager/node')

const { baseFolder = 'src', _: sourceFiles = [] } = runtime.argv

const { intersection } = runtime.lodash

async function main() {
  if (process.env.POSTINSTALL) {
    process.exit(0)
  }

  runtime.use(require('..'))

  await runtime.scripts.discover({
    defaults: {
      babelConfig: require('@skypager/helpers-document/src/babel/babel-config')(),
    },
  })

  const apiDocs = sourceFiles.length ? sourceFiles : runtime.get('projectConfig.apiDocs', [])

  if (apiDocs.length) {
    apiDocs.forEach(item => {
      if (item.indexOf('*') !== -1) {
        sourceFiles.push(
          ...intersection(
            runtime.scripts.available.map(i => `${i}.js`),
            runtime.fileManager.matchPatterns(...[item])
          )
        )
      } else {
        sourceFiles.push(...runtime.scripts.available.filter(id => id === item))
      }
    })
  } else if (!sourceFiles.length) {
    sourceFiles.push(...runtime.scripts.available.filter(id => id.startsWith(baseFolder)))
  }

  const scripts = sourceFiles.map(id => runtime.script(id.replace(/\.js$/, '')))

  await Promise.all(scripts.map(generateMarkdown))

  let docs = []
  let errors = []

  if (runtime.argv.verify !== false) {
    await runtime.mdxDocs.discover()

    docs = await Promise.all(
      runtime.mdxDocs.available.map(id => {
        const mdxDoc = runtime.mdxDoc(id)
        return mdxDoc
          .process()
          .then(() => mdxDoc)
          .catch(error => {
            errors.push({ error, id, mdxDoc})
            return false
          })
      })
    ).then(results => results.filter(Boolean))
  }

  if (runtime.argv.interactive || runtime.argv.console) {
    await runtime.repl('interactive').launch({ runtime, sourceFiles, apiDocs, docs })
  }

  if (runtime.argv.verify !== false && errors.length) {
    console.error('Some documents failed to generate valid MDX.')
    errors.map(({ error, id }) => {
      console.log(`File: ${id}`)
      console.log(error.message)
      console.log("")
    })
    process.exit(1)
  }
}

async function generateMarkdown(script) {
  const { dirname } = runtime.pathUtils
  const { relative } = script.file
  const destination = relative.replace(baseFolder, 'docs/api').replace('.js', '.md')

  const output = await runtime
    .select('process/output', {
      cmd: `jsdoc2md ${script.file.relative}`,
      format: 'raw',
    })
    .catch(error => {
      console.log(`Error Generating Markdown for ${script.file.relative}`)
      console.error(error.message)
      console.log(String(error.stdout))
    })

  if (output) {
    console.log(`${relative} to ${destination}`)
    await runtime.fsx.mkdirpAsync(runtime.resolve(dirname(destination)))
    await runtime.fsx.writeFileAsync(runtime.resolve(destination), output, 'utf8')
  }
}

main()
