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

async function main() {
  const { start = 'start' } = runtime.argv
  let { url } = runtime.argv
  let builtUrlObj, testUrl

  if (!url) {
    builtUrlObj = await buildUrl()
    testUrl = `${builtUrlObj.url}:${builtUrlObj.port}`
    localServer = spinUpLocalhost(builtUrlObj)
  } else {
    testUrl = url
  }

  try {
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
    await runTests(testUrl)
    console.log(`Success: ${colors.bold.green(runtime.currentPackage.name)}`)
    return
  } catch (error) {
    console.error(`${colors.bold.red(runtime.currentPackage.name)}. The test suite failed.`)
    throw error
  }
}

const checkServer = async testUrl => {
  const startAt = Date.now()
  let serverIsReady

  if (serverIsReady) {
    return testUrl
  }
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
      sleep(1000).then(() => checkServer(testUrl))
    })
}

async function buildUrl() {
  const { port } = runtime.argv
  const hostname = 'localhost'

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
  const { networking } = runtime
  chosenPort =
    chosenPort || parseInt(process.env.SERVER_PORT || 7000 + Math.floor(Math.random() * 1000))
  let openPort = await networking.findOpenPort(chosenPort)

  if (isCI || runtime.argv.computerChoosesPort) {
    return openPort
  }

  // pass --computerChoosesPort to let the computer choose the port
  if (chosenPort !== openPort || !runtime.argv.computerChoosesPort) {
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
    // disabling eslint here because we're not letting the promise resolve gracefully, which means there's always an error thrown
    /* eslint-disable */
  }).catch(error => {
    console.log('Server shutting down')
    console.log('Error message', error.message)
      /* eslint-enable */
  })
}

function runTests(testUrl) {
  const { showBrowser = false, test = 'test' } = runtime.argv

  const args = [test]

  if (showBrowser) {
    args.push('--show-browser')
  }

  return spawn('yarn', args, {
    env: { ...process.env, URL: testUrl, TEST_URL: testUrl },
    stdio: 'inherit',
  })
}

main()
  .then(() => {
    console.log(`${runtime.currentPackage.name} FINISHED`)
    if (localServer) {
      process.kill(-localServer.childProcess.pid)
    }

    process.exit(0)
  })
  .catch(error => {
    if (localServer) {
      process.kill(-localServer.childProcess.pid)
    }
    console.log('Exiting with process code 1')
    process.exit(1)
  })
