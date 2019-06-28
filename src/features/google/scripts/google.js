const runtime = require('@skypager/node')
const googleCommand = require('../lib/cli/command')

async function main() {
  try {
    await googleCommand.main(runtime.argv._, runtime.argv)
  } catch(error) {
    console.error(error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

main()