const runtime = require('@skypager/node')
const { mkdirSync, existsSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')

const isCI = process.env.CI || process.env.JOB_NAME
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(__dirname, '..', 'secrets', 'serviceAccount.json')
const credentialExists = existsSync(serviceAccountPath)

if (isCI && !credentialExists && process.env.SERVICE_ACCOUNT_DATA) {
  !existsSync(dirname(serviceAccountPath)) && mkdirSync(dirname(serviceAccountPath))
  writeFileSync(serviceAccountPath, process.env.SERVICE_ACCOUNT_DATA)
}

runtime.use(require('../lib'), {
  serviceAccount: serviceAccountPath,
  googleProject: require(serviceAccountPath).project_id,
})

const { colors, print } = runtime.cli

async function main() {
  print(`Performing sanity test on the google sheets / drive integration`)
  await runtime.sheets.discover()

  if (!runtime.sheets.available.length) {
    print(`Could not find any sheeets`)
    print(colors.red('FAIL'))
    process.exit(1)
  } else {
    const sheet = runtime.sheet(runtime.sheets.available[0])

    await sheet.authorize()
    const info = await sheet.getInfo().catch(error => {
      print(colors.red('FAIL'))
      print(error.message)
      print(error.stack, 8, 2, 2)
      process.exit(1)
    })

    if (!info || !info.worksheets) {
      print(colors.red('FAIL'))
      print(`Could not fetch spreadsheet info`)
      process.exit(1)
    }

    print(`Found ${runtime.sheets.available.length} sheets via the google drive files api`)
    print(`Fetched worksheets from one of the sheets`)
    print(colors.green('SUCCESS'))
    process.exit(0)
  }
}

main().catch(error => {
  print(colors.red('FAIL'))
  print(error.message)
  print(error.stack, 8, 2, 2)
})
