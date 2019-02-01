const runtime = require('@skypager/node')
const { existsAsync: exists } = runtime.fsx
const { resolve } = runtime.pathUtils
const { colors, print } = runtime.cli
const { spawn } = runtime.proc.async

async function findCommand(scriptFilename, checkPaths, runtimeArgs = [], commandArgs = []) {
  const skypagerPackagePaths = await runtime.packageFinder.find(/@skypager\/.*/)
  const portfolioName = runtime.currentPackage.name.split('/')[0]

  if (portfolioName !== '@skypager') {
    const portfolioPackagePaths = await runtime.packageFinder.find(new RegExp(`^${portfolioName}`))
    skypagerPackagePaths.push(...portfolioPackagePaths)
  }

  const scriptPaths = await Promise.all(
    skypagerPackagePaths.map(folder => {
      const check = resolve(folder, 'scripts')
      return exists(check).then(yes => yes && check)
    })
  ).then(matches => matches.filter(Boolean))

  const withScripts = await Promise.all(
    skypagerPackagePaths.map(folder => {
      const check = resolve(folder, 'scripts', scriptFilename)
      return exists(check).then(yes => yes && check)
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
