const runtime = require('@skypager/node')

runtime.use(require('../lib'))

async function main() {
  const fixturePath = runtime.resolve('test', 'fixtures', 'WebApplication.sketch')
  const sketch = runtime.sketch('WebApplication', { path: fixturePath })

  runtime.repl('interactive').launch({
    runtime,
    sketch,
  })
}

main()
