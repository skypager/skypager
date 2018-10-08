const runtime = require('@skypager/node')
const { print } = runtime.cli
const { writeFileAsync: write, mkdirpAsync: mkdir } = runtime.fsx
const { spawn, exec } = runtime.proc.async
const { resolve } = require('path')
const { nowToken = readNowToken() } = runtime.argv

main()

async function main() {
  print(`Preparing Web Release`)
  await prepareWebRelease()
  print(`Deploying public to now`)
  await deployToNow()
}

async function deployToNow() {
  await spawn('now', ['--static', '--token', nowToken], {
    stdio: 'inherit',
    cwd: runtime.resolve('public'),
  })
  await spawn(
    'now',
    [
      '--token',
      nowToken,
      'alias',
      runtime.gitInfo.branch === 'master' ? 'skypager.io' : 'dev.skypager.io',
    ],
    {
      stdio: 'inherit',
      cwd: runtime.resolve('public'),
    }
  )
}
async function prepareWebRelease() {
  await exec(`node scripts/prepare-web-release.js`)
}

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
