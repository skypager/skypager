module.exports = async function setupSocketListeners(socket, runtime) {
  socket.subscribe(
    '/vm/run-code',
    ({ code, taskId = runtime.hashObject({ code }), ...options }) => {
      return runCode(code, options)
        .then(response => {
          return socket.publish(`/vm/run-code/response/${taskId}`, {
            result: response,
          })
        })
        .catch(error => {
          return socket.publish(`/vm/run-code/response/${taskId}`, { error })
        })
    }
  )

  async function runCode(code, options = {}) {
    const response = await runtime.scriptRunner.runCode(code, options)

    const result = await response.result

    return result
  }
}
