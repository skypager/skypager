const runtime = require('@skypager/node')

async function main() {
  const requireScripts = runtime.lodash.castArray(runtime.argv.require).filter(Boolean)

  if (requireScripts.length) {
    for (let script of requireScripts) {
      await runtime.scriptRunner.runScriptAtPath(runtime.resolve(script))
    }
  }

  if (runtime.argv.devMode) {
    await runtime.fileManager.startAsync({ startPackageManager: true }).catch(error => error)

    try {
      runtime.use(require('@skypager/helpers-document'))
    } catch (error) {
      console.error(error)
    }

    const serviceAccount = runtime.resolve('secrets', 'serviceAccount.json')

    if (runtime.fsx.existsSync(serviceAccount)) {
      try {
        runtime.use(require('@skypager/helpers-sheet'), {
          serviceAccount,
          projectId: require(serviceAccount).project_id,
        })
      } catch (error) {
        console.error(error)
      }

      try {
        runtime.use(require('@skypager/helpers-google-doc'), {
          serviceAccount,
          projectId: require(serviceAccount).project_id,
        })
      } catch (error) {}
    }

    try {
      runtime.use(require('@skypager/features-webpack'))
    } catch (error) {}
  }

  runtime.repl('interactive').launch({
    runtime,
    skypager: runtime,
    lodash: runtime.lodash,
    fileManager: runtime.fileManager,
    packageManager: runtime.packageManager,
  })
}

main()
