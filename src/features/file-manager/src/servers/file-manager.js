export async function serverWillStart() {
  await this.runtime.fileManager.startAsync()
  await this.runtime.fileManager.syncMemoryFileSystem({ fallback: true })
}

export function appWillMount(app) {
  const { runtime } = this
  const { fsm } = runtime

  app.get(`/api/:pathParts`, (req, res) => {
    res.json({
      pathParts: req.params.pathParts,
    })
  })
}
