const runtime = require('@skypager/node')

const socket = runtime.feature('socket')

socket.enable()

socket.listen({ removeLock: true }).then(() => {
  require('./socket.vm-runner')(socket, runtime)
})
