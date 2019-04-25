const runtime = require('@skypager/node')
const socket = runtime.feature('socket')

socket.enable()

socket.connect().then(() => {
  console.log('Connected To', socket.socketPath)
  socket.ipc.on('/vm/run-code/response/some-task-id', payload => {
    console.log('got something')
    console.log(payload)
  })

  socket.publish('/vm/run-code', {
    taskId: 'some-task-id',
    code: `skypager.fileManager.startAsync().then((fm) => fm.fileIds.slice(0,20))`,
  })
})
