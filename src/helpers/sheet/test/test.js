require('@skypager/devtools/testing/mocha-test-setup')

const { existsSync, writeFileSync } = require('fs')
const { resolve } = require('path')

const isCI = process.env.CI || process.env.JOB_NAME
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(__dirname, '..', 'secrets', 'serviceAccount.json')
const credentialExists = existsSync(serviceAccountPath)

if (isCI && !credentialExists && process.env.SERVICE_ACCOUNT_DATA) {
  writeFileSync(serviceAccountPath, process.env.SERVICE_ACCOUNT_DATA)
}
