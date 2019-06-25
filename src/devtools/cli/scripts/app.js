const runtime = require('@skypager/node')

async function main() {
  const requestedHelp = runtime.argv.help || runtime.argv._[0] === 'help'

  if (requestedHelp) {
    displayHelp()
  } else {
    return handler()
  }
}

function displayHelp() {
  const { colors, randomBanner, print } = runtime.cli

  randomBanner('Skypager')
  print(colors.bold.underline(`Skypager CLI App RUnner`), 0, 0, 1)
  console.log(
    `
    The Cli App is an experimental feature, testing using @react/ink to power cli apps
    `.trim()
  )
}

const handler = async () => {
  runtime.cli.clear()

  await runtime.fileManager.startAsync({ startPackageManager: true })

  const { waitUntilExit } = require('../lib/app')({ exitOnCtrlC: true }, runtime)

  return waitUntilExit()
}

main()
