const runtime = require('@skypager/node')

runtime.use(require('..'))

async function main() {
  const code = `
  import runtime from '@skypager/node'
  async function main() {
    console.log(runtime.cwd)
  };main()
  `

  const test = runtime.script('test', {
    content: code,
  })

  await test.parse()

  runtime.repl('interactive').launch({
    runtime,
    test,
  })
}

main()
