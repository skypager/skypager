const runtime = require('@skypager/node').use(require('@skypager/helpers-document'))

const { baseFolder = 'src', _: sourceFiles = [] } = runtime.argv

const { intersection } = runtime.lodash

async function main() {
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

  if (runtime.argv.interactive) {
    await runtime.repl('interactive').launch({ runtime, sourceFiles, apiDocs })
  }
}

async function generateMarkdown(script) {
  const { dirname } = runtime.pathUtils
  const { relative } = script.provider
  const destination = relative.replace(baseFolder, 'docs/api').replace('.js', '.md')

  const output = await runtime
    .select('process/output', {
      cmd: `jsdoc2md ${script.provider.relative}`,
      format: 'raw',
    })
    .catch(error => {
      console.log(`Error Generating Markdown for ${script.provider.relative}`)
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
