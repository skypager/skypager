# Socket Server
> cross platform IPC communication for skypager node runtimes

## Example of using the socket server as a VM

Running the socket server from a shell, you can pass the `--script` flag to run a script
which can be used to setup subscriptions. 

```shell
skypager socket --script ./socket-setup.js --socket-name vm-runner
```

In the script below, this function gets called when the server is listening.  

We setup a subscription on `/vm/run-code` which will run a string of code inside
of skypager's vm, and return the result back to you.  If the resulting code is a promise,
it will resolve it for you. 

The resulting object is then published on the `/vm/run-code/response/:taskId` channel

```javascript
// socket-setup.js
module.exports = async function setupSocketListeners(socket, runtime) {
  socket.subscribe('/vm/run-code', ({ code, taskId = runtime.hashObject({ code }), ...options }) => {
    runCode(code, options)
      .then(response => socket.publish(`/vm/run-code/response/${String(taskId).replace(/\W/g, '')}`, { result: response }))
      .catch(error => socket.publish(`/vm/run-code/response/${String(taskId).replace(/\W/g, '')}`, { error }))
  })

  async function runCode(code, options = {}) {
    const response = await runtime.scriptRunner.runCode(code, options)

    const result = await response.result

    return result
  }
}
```

And then in another script / process

```javascript
const runtime = require('@skypager/node')
const socket = runtime.feature('socket', { socketName: 'vm-runner' })

socket.connect().then(() => {
  socket.once(`/vm/run-code/response/some-task-id`, (fileIds) => {
    console.log('File IDs', fileIds)
  })
  
  socket.publish('/vm/run-code', {
    taskId: 'some-task-id',
    code: `skypager.fileManager.startAsync().then((fm) => fm.fileIds.slice(0,20))`
  })
})
```