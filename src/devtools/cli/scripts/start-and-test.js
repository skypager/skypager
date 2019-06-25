const runtime = require('@skypager/node')
const axios = require('axios')
const { colors, ask } = runtime.cli
const { spawn } = runtime.proc.async

const hasEnvironmentVariable = (...list) =>
  !!runtime.chain
    .get('os.environment')
    .pick(list)
    .values()
    .find(Boolean)
    .get('length', 0)
    .value()

const isCI = hasEnvironmentVariable('JOB_NAME', 'BRANCH_NAME', 'CI') || runtime.argv.ci
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

let localServer

const testDelay = runtime.argv.testDelay
  ? parseInt(runtime.argv.testDelay, 10)
  : 5000

async function main() {
  const requestedHelp = runtime.argv.help || runtime.argv._[0] === 'help'

  if (requestedHelp) {
    displayHelp()
  } else {
    return handler()
  }
}

function displayHelp() {
  const { colors, randomBanner, print } = runtime.cli

  randomBanner('Skypager')
  print(colors.bold.underline(`Skypager Start and Test`), 0, 0, 1)
  console.log(
    `
    Start a server, run a script, stop the server.

    Useful for when you want to run a test suite that needs to have a server started before it can run,
    and when you want to stop the server when the command finishes.

    ${colors.bold.underline('Examples')}:

    ${colors.bold.underline('Options')}:
      --esm             enable es module import/export syntax
      --babel           enable @babel/register on the fly module transpilation
      --start <script>  the package.json script that starts the server
      --test <script>   the package.json script that runs the test command
    `.trim()
  )
}

async function doWork() {
  const { start = 'start' } = runtime.argv
  let { url } = runtime.argv
  let builtUrlObj, testUrl

  if (!url) {
    builtUrlObj = await buildUrl()
    testUrl = `${builtUrlObj.url}:${builtUrlObj.port}`
    console.log('Build URL', builtUrlObj)
    localServer = spinUpLocalhost(builtUrlObj)
  } else {
    testUrl = url
  }

  try {
    await sleep(testDelay)
    await checkServer(testUrl).then(
      new Promise((resolve, reject) => {
        runtime.once('serverIsReady', resolve)
        runtime.once('serverFailed', reject)
      })
    )
  } catch (error) {
    console.error(`Error spawning test server`)
    console.error(error.message)
  }

  try {
    await runTests(testUrl, builtUrlObj || {})
    return
  } catch (error) {
    console.error(`${colors.bold.red(runtime.currentPackage.name)}. The test suite failed.`)
    throw error
  }
}

const startAt = Date.now()

const checkServer = async testUrl => {
  let serverIsReady

  if (serverIsReady) {
    return testUrl
  }

  try {

  axios
    .get(testUrl)
    .then(() => {
      serverIsReady = true
      runtime.emit('serverIsReady')
      return testUrl
    })
    .catch(error => {
      if (Date.now() - startAt > 20000) {
        console.log(error)
        console.log(`Something happened... ${error}`)
        runtime.emit('serverFailed')
        throw error
      }
      return sleep(1000).then(() => checkServer(testUrl))
    })
  } catch(error) {
    console.error(error.message)
    process.exit(1)
  }

}

async function buildUrl() {
  const { port, host, hostname = host || 'localhost' } = runtime.argv

  if (port) {
    return {
      url: `http://${hostname}`,
      hostname,
      port,
    }
  } else {
    const port = await choosePort()
    return {
      url: `http://${hostname}`,
      hostname,
      port,
    }
  }
}

async function choosePort(chosenPort) {
  if (runtime.argv.auto || runtime.argv.port === 'auto') {
    chosenPort =
      chosenPort || parseInt(process.env.SERVER_PORT || 7000 + Math.floor(Math.random() * 1000)) 
  }

  const { networking } = runtime

  chosenPort =
    chosenPort || parseInt(process.env.SERVER_PORT || 7000 + Math.floor(Math.random() * 1000))

  let openPort = await networking.findOpenPort(chosenPort)

  if (isCI || runtime.argv.auto) {
    return openPort
  }

  // pass --auto to let the computer choose the port
  if (chosenPort !== openPort || !runtime.argv.auto) {
    const response = await ask({
      port: {
        description: 'port?',
        default: openPort,
      },
    })

    const isOpen = await networking.isPortOpen(response.port)

    if (!isOpen) {
      console.log('That port is already taken. Try another.')
      return await networking.findOpenPort(response.port).then(val => choosePort(val))
    }

    return response.port
  }
}

function spinUpLocalhost(builtUrlObj) {
  const { start = 'start' } = runtime.argv

  console.log(`${colors.bold.cyan(runtime.currentPackage.name)} starting server`)

  return spawn('yarn', [start, '--port', builtUrlObj.port], {
    stdio: 'inherit',
    detached: true,
    env: {
      PORT: builtUrlObj.port,
      ...process.env,
    }
    // disabling eslint here because we're not letting the promise resolve gracefully, which means there's always an error thrown
    /* eslint-disable */
  }).catch(error => {
    console.log('Server shutting down')
    console.log('Error message', error.message)
    /* eslint-enable */
  })
}

function runTests(testUrl, options = {}) {
  const { showBrowser = false, test = 'test' } = runtime.argv
  let { port = runtime.argv.port || process.env.PORT } = options 

  // console.log('Running Tests', testUrl, options)

  const args = [ test ]

  if (showBrowser) {
    args.push('--show-browser')
  }

  if (runtime.argv.logLevel === 'debug') {
    console.log('yarn', args, {
      env: { URL: testUrl, TEST_URL: testUrl, ...(port && String(port).length && { PORT: String(port) }) },
      stdio: 'inherit',
    })
  }

  return spawn('yarn', args, {
    env: { ...process.env, URL: testUrl, TEST_URL: testUrl, ...(port && String(port).length && { PORT: String(port) }) },
    stdio: 'inherit',
  }) 
}

async function handler() {
  try {
    await doWork()
    killServer()
    process.exit(0)
  } catch(error) {
    killServer()
    process.exit(1)
  }
}

function killServer() {
  try {
    if (localServer) {
      process.kill(-localServer.childProcess.pid)
    }
  } catch (error) {}  
}

main()
  .then(() => {

    })
  .catch(error => {
    try {
      if (localServer) {
        process.kill(-localServer.childProcess.pid)
      }
    } catch (error) {}

    console.error(error)
    console.log('Exiting with process code 1')
    process.exit(1)
  })
