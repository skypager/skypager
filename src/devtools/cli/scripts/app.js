const runtime = require('@skypager/node')

runtime.cli.clear()

runtime.fileManager
  .startAsync({ startPackageManager: true })
  .then(() => require('../lib/app')(runtime))
