const runtime = require('@skypager/node')
const axios = require('axios')

let attempts = 0
let pass = false
const serverPort = runtime.argv.port || 3000

main()

async function main() {
  const proc = runtime.proc.async
    .spawn('yarn', ['start'], {
      stdio: 'ignore',
    })
    .catch(error => {
      if (error.message.match(/failed with code null/)) {
        process.exit(pass ? 0 : 1)
      }
    })

  await waitForServer()
  await sleep(2000)

  pass = await runTests()

  console.log('SUCCESS!')

  process.kill(proc.childProcess.pid)
}

async function runTests() {
  await Promise.all([testVM(), testMdx()]).catch(error => {
    console.error(error.message)
    return false
  })

  return true
}

async function testVM() {
  const testBabelCode = `
  import runtime from '@skypager/node'

  const things = [1,2,3,4,5]

  async function main() {
    return true
  }

  main()
  `

  const response = await axios.post(`http://localhost:${serverPort}/vm`, {
    content: testBabelCode,
    transpile: true,
    name: 'test-babel',
  })

  const { data, status } = response

  if (status !== 200) {
    console.error('Expected 200 Status response from /vm')
    return false
  }

  if (!data || !data.instructions) {
    console.error('Expected to receive instructions data from /vm')
    return false
  }

  return true
}

async function testMdx() {
  const testMdxCode = `
  # Hello World
  > nice

  **How are you**?

  ## Subheading

  ### Subheading 2
  ### Subheading 3
  `

  const response = await axios.post(`http://localhost:${serverPort}/mdx`, {
    content: testMdxCode,
    transpile: true,
    name: 'test-babel',
  })

  const { data, status } = response

  if (status !== 200) {
    console.error('Expected 200 Status response from /mdx')
    return false
  }

  if (!data || !data.parsed) {
    console.error('Expected to receive data from /mdx')
    return false
  }

  return true
}

async function waitForServer(port = serverPort) {
  const isPortListening = await runtime.networking.isPortOpen(port)

  if (!isPortListening) {
    attempts = attempts + 1
    await sleep(attempts * 1000)
    console.log('Waiting for server')
    return waitForServer(port)
  }

  return true
}

function sleep(ms = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
