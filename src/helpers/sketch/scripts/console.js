const runtime = require('@skypager/node')

runtime.use(require('../lib'))

async function main() {
  const dumpPath = runtime.resolve('test', 'fixtures', 'dump.json')
  const fixturePath = runtime.resolve('test', 'fixtures', 'design-system.sketch')

  const dump = await runtime.fsx.readJsonAsync(dumpPath)

  runtime.repl('interactive').launch({
    runtime,
    dump,
    dumpPath,
    fixturePath,
  })
}

main()
