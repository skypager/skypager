require('@skypager/devtools/testing/mocha-test-setup')
require('../scripts/install-secrets')

if (process.env.CI) {
  console.log('Skipping tests in CI')
  process.exit(0)
}
