const host = require('@skypager/node')
const runtime = host
  .spawn({ cwd: host.gitInfo.root })
  .use('runtimes/node')
  .use(require('@skypager/portfolio-manager'))

const portfolio = runtime.portfolio

const { print } = runtime.cli

async function main() {
  print(`Starting Portfolio Manager`)
  await runtime.fileManager.startAsync({ startPackageManager: true })
  await runtime.moduleManager.startAsync()
  await portfolio.startAsync()

  const { packageGraph, moduleGraph } = await exportGraphs()

  if (host.argv.interactive) {
    host.repl('interactive').launch({ portfolio, runtime, host, packageGraph, moduleGraph })
  }
}

async function exportGraphs() {
  const { packageManager, moduleManager } = portfolio

  print('Exporting Portfolio Package Graph')
  const packageGraph = await packageManager.exportGraph()

  await host.fsx.mkdirpAsync(host.resolve('build'))

  await host.fsx.writeJsonAsync(host.resolve('build', 'package-graph.json'), packageGraph)

  print('Exporting Module Graph')
  const moduleGraph = await moduleManager.exportGraph()
  await host.fsx.writeJsonAsync(host.resolve('build', 'module-graph.json'), moduleGraph)

  return { packageGraph, moduleGraph }
}

main()
