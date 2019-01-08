const runtime = require('@skypager/node')

runtime.use(require('../lib'))

async function main() {
  const webappPath = runtime.resolve('test', 'fixtures', 'WebApplication.sketch')
  const stylePath = runtime.resolve('test', 'fixtures', 'StyleGuide.sketch')
  const sketch = runtime.sketch('WebApplication', { path: webappPath })
  const styleGuide = runtime.sketch('StyleGuide', { path: stylePath })
  const webApplication = sketch

  runtime.repl('interactive').launch({
    runtime,
    sketch,
    webApplication,
    styleGuide,
  })
}

main()
