require('@skypager/devtools/testing/mocha-test-setup')

if (process.env.CI) {
  console.log('skipping in ci for now, how do i make sure sketchtool is there')
  process.exit(0)
}
