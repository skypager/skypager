const runtime = require('@skypager/node')
const { fileManager: files } = runtime
const parse = require('../parser')

main()

async function main() {
  const { castArray } = runtime.lodash
  const pattern = runtime.argv._[0] || runtime.argv.pattern || 'README.md'

  if (!pattern) {
    console.error('Usage: skypager mdx <pattern>')
    process.exit(1)
  }

  await files.startAsync()
  await files.readAllContent({ include: castArray(pattern).filter(Boolean) })

  const tasks = files.chains
    .patterns(pattern)
    .values()
    .value()

  const count = tasks.length

  if (count === 0) {
    console.error(`No mdx files found matching ${pattern}`)
  }

  await Promise.all(tasks.map(task => compile(task).then(code => console.log(code))))
}

async function compile({ path, relative, content }) {
  const mdx = await parse(content, {
    filePath: path,
  })

  const { code } = mdx

  return code
}
