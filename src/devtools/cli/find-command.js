const runtime = require('@skypager/node')
const { existsAsync: exists } = runtime.fsx
const { resolve } = runtime.pathUtils
const { colors, print } = runtime.cli
const { spawn } = runtime.proc.async
const { get } = runtime.lodash

async function findCommand(scriptFilename, checkPaths, runtimeArgs = [], commandArgs = []) {
  const searchPackagePaths = await runtime.packageFinder.find(/@skypager\/.*/)
  const portfolioName = runtime.currentPackage.name.split('/')[0]

  if (portfolioName !== '@skypager') {
    const portfolioPackagePaths = await runtime.packageFinder.find(new RegExp(`^${portfolioName}`))
    searchPackagePaths.push(...portfolioPackagePaths)
  }

  const scriptPaths = await Promise.all(
    searchPackagePaths.map(folder => {
      const check = resolve(folder, 'scripts')
      return exists(check).then(yes => yes && check)
    })
  ).then(matches => matches.filter(Boolean))

  const withScripts = await Promise.all(
    scriptPaths.map(folder => {
      const check = resolve(folder, scriptFilename)

      let scripts

      try {
        const pkgManifest = require(runtime.pathUtils.resolve(folder, '..', 'package.json'))
        scripts = get(pkgManifest, 'skypager.providesScripts', [])

        if (scripts === false) {
          scripts = []
        }

        // only pull scripts from certain @skypager packages
        if (
          !scripts.length &&
          !pkgManifest.name.match(/@skypager\/(helpers|features|devtools|portfolio-manager)/)
        ) {
          scripts = []
        }

        if (portfolioName !== '@skypager') {
          const portfolioScriptsConfig = get(pkgManifest, [
            portfolioName.replace('@', ''),
            'providesScripts',
            [],
          ])

          if (portfolioScriptsConfig && portfolioScriptsConfig.length) {
            scripts.push(...portfolioScriptsConfig)
          }
        }
      } catch (error) {
        console.error(error.message)
      }

      return exists(check).then(
        yes =>
          yes &&
          check &&
          (!scripts.length || scripts.indexOf(scriptFilename.replace(/\.js$/, '')) > -1) &&
          check
      )
    })
  ).then(matches => matches.filter(Boolean))

  const scriptPath = withScripts[0]

  if (!scriptPath) {
    print(colors.red('ERROR'))
    print(`Could not find a script to handle ${scriptFilename}`, 0, 2)
    print('Checked the following paths:', 2)
    print(checkPaths.concat(scriptPaths), 4)
    process.exit(1)
  }

  try {
    const { childProcess } = await spawn('node', [...runtimeArgs, scriptPath].concat(commandArgs), {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    process.exit(childProcess.exitCode)
  } catch (error) {
    console.error(`${scriptPath} exited with non-zero exit code.`)
    process.exit(1)
  }
}

module.exports = findCommand
