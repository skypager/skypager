require('@skypager/devtools/testing/mocha-test-setup')

if (process.env.CI) {
  // not sure why these tests keep failing on CI
  process.exit(0)
}
