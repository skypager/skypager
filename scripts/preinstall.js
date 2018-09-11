const { verifyNpmLogin } = require('./shared/check')

verifyNpmLogin()
  .then(user => {
    if (user) {
      console.log(`Logged in to NPM as ${user}`)
    } else {
      throw new Error(`You must be logged into NPM and have access to the @skypager org`)
    }
  })
  .catch(error => {
    console.error(error.message)
    process.exit(1)
  })
