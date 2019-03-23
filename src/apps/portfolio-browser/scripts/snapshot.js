const runtime = require('@skypager/node')
const portfolio = runtime.spawn({
  cwd: runtime.resolve('..', '..', '..'),
})
const { clear, print } = runtime.cli

async function main() {
  clear()
  portfolio.use('runtimes/node').use(require('@skypager/portfolio-manager'))

  print('Starting Portfolio Manager')
  await portfolio.fileManager.startAsync()
  await portfolio.packageManager.startAsync()
  await portfolio.moduleManager.startAsync()

  print('Exporting portfolio package graph')
  const packageGraph = await portfolio.packageManager.exportGraph()
  await runtime.fsx.writeJsonAsync(runtime.resolve('build', 'package-graph.json'), packageGraph)

  print('Exporting portfolio module graph')
  const moduleGraph = await portfolio.moduleManager.exportGraph()
  await runtime.fsx.writeJsonAsync(runtime.resolve('build', 'module-graph.json'), moduleGraph)
}

main().catch(error => {
  print(error.message)
  print(error.stack, 8)
  process.exit(1)
})
