module.exports = async function setupDocumentHelperSocket(socket, runtime) {
  if (!runtime.script) {
    runtime.use(require('@skypager/helpers-document'))
  }

  socket.subscribe('/document-helper/script-vm', data => {
    const { messageId, taskId = messageId } = data

    process(data).then(response => {
      socket.publish(`/document-helper/script-vm/${taskId}`, response)
    })
  })

  async function process({ content, name, transpile = true }) {
    const response = {}

    const script = runtime.script(name, {
      content,
    })

    try {
      await script.parse()
    } catch (error) {
      response.error = error
    }

    if (!response.error) {
      try {
        const instructions = await script.createVMInstructions({ transpile })
        response.instructions = instructions
      } catch (error) {
        response.error = error
      }
    }

    return response
  }
}
