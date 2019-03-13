const runtime = require('@skypager/node')

runtime.cli.clear()

const main = async () => {
  await runtime.fileManager.startAsync({ startPackageManager: true })

  const { waitUntilExit } = require('../lib/app')({ exitOnCtrlC: true }, runtime)

  return waitUntilExit()
}

main()
