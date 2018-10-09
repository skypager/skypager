const runtime = require('@skypager/node')
const { spawn } = runtime.proc.async
const { resolve } = require('path')
const { clear, print, randomBanner } = runtime.cli
const { nowToken = readNowToken(), debug = false, verbose } = runtime.argv

clear()
randomBanner(`Skypager`)
print(`Deploying Sheets Server Example`)

async function main() {
  print(`Deploying to now.sh`)
  await spawn(
    'now',
    `--token ${nowToken} -e SERVICE_ACCOUNT_DATA=@skypager-sheets-server-sa --npm ${
      debug ? '--debug' : ''
    }`.split(' '),
    {
      stdio: verbose ? 'inherit' : 'ignore',
    }
  )
  print(`Aliasing deployment.`)
  await spawn('now', ['--token', nowToken, 'alias'])
}

main()

function readNowToken() {
  if (process.env.NOW_TOKEN) {
    return process.env.NOW_TOKEN
  }

  try {
    return require(resolve(process.env.HOME, '.now.json')).token
  } catch (error) {
    console.log(
      'Could not retrive NOW_TOKEN.  Please set the environment variabe, pass --now-token as an argv, or make sure you have a now.json file in your home directory.'
    )
    process.exit(1)
  }
}
