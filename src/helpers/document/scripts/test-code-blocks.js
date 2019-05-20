const runtime = require('@skypager/node')

runtime.use(require('@skypager/helpers-document'))

main()

async function main() {
  const pattern = runtime.argv._[0] || runtime.argv.pattern || 'README.md'
  const docs = await registerDocHelpers(pattern)

  const ok = []
  const fail = []

  for (let doc of docs) {
    const passed = await testCodeBlocks(doc)
    if (passed) {
      ok.push(doc)
    } else {
      fail.push(doc)
    }
  }
}

async function testCodeBlocks(doc) {
  console.log(doc.title)
}

async function registerDocHelpers(pattern) {
  await runtime.fileManager.startAsync()

  const matches = runtime.fileManager.chains
    .patterns(pattern)
    .values()
    .value()

  const docs = await Promise.all(
    matches.map(file =>
      runtime.fsx.readFileAsync(file.path).then(buf => {
        const { path, relative } = file
        const docId = relative.replace(/\.md$/, '')

        runtime.fileManager.files.set(relative, {
          ...file,
          content: buf.toString(),
          path,
        })

        runtime.mdxDocs.register(docId, () => ({
          content: file.content,
          file,
        }))

        file = runtime.fileManager.files.get(relative)

        const doc = runtime.mdxDoc(docId, { content: file.content, file })

        return doc.process().then(() => doc)
      })
    )
  )

  return docs
}
