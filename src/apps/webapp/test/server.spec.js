import runtime from '@skypager/node'
import axios from 'axios'

describe('The Sheets Server', function() {
  let pid, port

  before(async function() {
    port = await runtime.networking.findOpenPort()
    const { childProcess } = runtime.proc.async.spawn(
      'node',
      [
        '--require',
        'esm',
        'scripts/serve.js',
        '--port',
        port,
        '--host',
        'localhost',
        '--hostname',
        'localhost',
      ],
      {
        cwd: runtime.cwd,
        stdio: 'inherit',
      }
    )

    pid = childProcess.pid

    await untilServerIsListening(port)
  })

  after(function() {
    try {
      process.kill(pid)
    } catch (error) {}
  })

  it('returns a list of sheets via an API', async function() {
    const data = await axios.get(`http://localhost:${port}/sheets`).then(r => r.data)
    data.should.be.an('object').that.is.not.empty
  })

  it('returns some html', async function() {
    const data = await axios.get(`http://localhost:${port}`).then(r => r.data)
    data.should.be.a('string').that.matches(/div id="root"/)
  })
})

let attempts = 0
async function untilServerIsListening(onPort) {
  const isPortOpen = await runtime.networking.isPortOpen(onPort)

  if (attempts > 10) {
    throw new Error('Server failed to start')
  }

  if (!isPortOpen) {
    return true
  } else {
    attempts = attempts + 1
    await new Promise((resolve, reject) => setTimeout(resolve, 1000))
    return untilServerIsListening(onPort)
  }
}
