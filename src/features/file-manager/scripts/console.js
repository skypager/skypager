process.env.DISABLE_SKYPAGER_FILE_MANAGER = true

const skypager = require('@skypager/node').use(require('../src'))

async function main() {
  await skypager.fileManager.startAsync({ startPackageManager: true })
  await skypager.moduleManager.startAsync({ maxDepth: 2 })
  await skypager.repl('interactive').launch({
    fm: skypager.fileManager,
    pm: skypager.packageManager,
    mm: skypager.moduleManager,
  })
}

main()
