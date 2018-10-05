const runtime = require('@skypager/node')
const { spawn } = runtime.proc.async
const { clear, print, randomBanner } = runtime.cli
const { debug = false, verbose } = runtime.argv

clear()
randomBanner(`Skypager`)
print(`Deploying Sheets Server Example`)

async function main() {
  print(`Deploying to now.sh`)
  await spawn(
    'now',
    `-e SERVICE_ACCOUNT_DATA=@skypager-sheets-server-sa --npm ${debug ? '--debug' : ''}`.split(' '),
    {
      stdio: verbose ? 'inherit' : 'ignore',
    }
  )
  print(`Aliasing deployment.`)
  await spawn('now', ['alias'])
}

main()
