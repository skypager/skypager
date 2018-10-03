require('@skypager/devtools/testing/mocha-test-setup')

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
