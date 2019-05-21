const runtime = require('@skypager/node')

runtime.use(require('@skypager/helpers-document'))

const { clear, print, colors } = runtime.cli
const { green, red, bold } = colors
const { flatten } = runtime.lodash

main()

async function main() {
  clear()
  const pattern = runtime.argv._[0] || runtime.argv.pattern || 'README.md'
  const docs = await registerDocHelpers(pattern)

  const ok = []
  const fail = []

  let total = 0
  let failCount = 0

  for (let doc of docs) {
    await doc.toRunnable()

    total = total + doc.runners.length

    const passed = await testCodeBlocks(doc)

    failCount = failCount + doc.runners.reduce((memo, { runner }) => memo + runner.errors.length, 0)

    if (passed) {
      ok.push(doc)
    } else {
      fail.push(doc)
    }
  }

  if (!fail.length) {
    print(`${total}/${total} tests ${green('PASSED')}`)
    process.exit(0)
  } else {
    total - failCount && print(`${total - failCount}/${total} tests ${green('PASSED')}`)
    print(`${failCount}/${total} tests ${red('FAILED')}`)
    process.exit(1)
  }
}

async function testCodeBlocks(doc) {
  print(bold.underline(doc.title), 0, 0, 1)

  const seen = {}

  for (let block of doc.runners) {
    const { script, parentHeading, runner, depth = 0 } = block
    await runner.run()

    const { startLine = script.tryGet('meta.position.start.line', 0) } = block

    const { errors = [], program = [] } = runner
    if (errors.length) {
      print(`${bold.red('FAIL')} ${red(parentHeading)} ${script.name}`, depth * 2)
      const { program = [] } = runner

      let gotError

      const output = program.map(({ statement, error, position }) => {
        const resp = !gotError
          ? [
              error && `  ${statement} (line #${startLine + position.start.line + 1})`,
              error && error.message && ' \n',
              error && error.message && `    ${error.message}`,
              error && error.message && ' \n',
            ].filter(Boolean)
          : []

        if (error && error.message) {
          gotError = true
        }

        return resp
      })

      print(flatten(output), depth * 2, 1, 0)
    } else {
      !seen[parentHeading] && print(`${green(parentHeading)}`, depth * 2, 0, 1)
      seen[parentHeading] = true
    }
  }

  return !doc.runners.find(r => r.runner && r.runner.errors && r.runner.errors.length)
}

async function registerDocHelpers(pattern) {
  await runtime.fileManager.startAsync()

  const matches = runtime.fileManager.chains
    .patterns(pattern)
    .values()
    .value()

  const docs = await Promise.all(
    matches.map(file => {
      const docId = file.relative.replace(/\.mdx?$/, '')

      runtime.mdxDocs.register(docId, {
        content: runtime.fsx.readFileSync(file.path).toString(),
        file,
      })

      const doc = runtime.mdxDoc(docId)

      return doc.process().then(() => doc)
    })
  )

  return docs
}
