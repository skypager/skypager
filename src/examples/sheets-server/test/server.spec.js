import runtime from '@skypager/node'
import axios from 'axios'

describe('The Sheets Server', function() {
  let pid, port

  before(async function() {
    port = await runtime.networking.findOpenPort()
    const { childProcess } = runtime.proc.async.spawn(
      'yarn',
      ['start', '--port', port, '--host', 'localhost', '--hostname', 'localhost'],
      {
        cwd: runtime.cwd,
        stdio: 'ignore',
      }
    )

    pid = childProcess.pid

    await new Promise(resolve => setTimeout(resolve, 5000))
  })

  after(function() {
    process.kill(pid)
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
