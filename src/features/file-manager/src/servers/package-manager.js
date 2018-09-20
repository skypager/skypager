import * as fileManager from './file-manager'

export async function serverWillStart(...args) {
  await fileManager.serverWillStart.call(this, ...args)
  await this.runtime.packageManager.startAsync()
}

export function appWillMount(app, ...args) {
  const { runtime } = this
  const { fsm } = runtime

  fileManager.appWillMount(app, ...args)

  app.get(`/api/package-manager/:pathParts`, (req, res) => {
    res.json({
      pathParts: req.params.pathParts,
    })
  })

  return app
}
