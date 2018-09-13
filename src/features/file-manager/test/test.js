// Tells the node runtime not to require the built version of this module
// so we can unit test it
process.env.DISABLE_SKYPAGER_FILE_MANAGER = true
require('@skypager/devtools/testing/mocha-test-setup')
