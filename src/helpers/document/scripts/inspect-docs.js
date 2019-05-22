const runtime = require('@skypager/node')

runtime.use(require('@skypager/helpers-document'))

const { clear, print, colors } = runtime.cli
const { green, red, bold } = colors
const { flatten } = runtime.lodash

main()

async function main() {
  clear()
  const pattern = runtime.argv._[0] || runtime.argv.pattern || 'docs/api/**/*.md'
  const docs = await registerDocHelpers(pattern)

  for (let doc of docs) {
    const { name, title } = doc
    print(`ID ${bold.green(name)} Title: ${bold(title)} `)
  }
}

async function registerDocHelpers(pattern) {
  await runtime.mdxDocs.discover()
  const matches = runtime.fileManager.chains
    .patterns(pattern)
    .values()
    .value()

  const docs = await Promise.all(
    matches.map(file => {
      const docId = file.relative.replace(/\.mdx?$/, '')
      const doc = runtime.mdxDoc(docId)
      return doc
        .process()
        .then(() => doc)
        .catch(error => {
          doc.setState({ error: error.message })
        })
    })
  )

  return docs
}
