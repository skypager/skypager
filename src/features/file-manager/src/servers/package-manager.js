import * as fileManager from './file-manager'

export async function appDidMount(...args) {
  await fileManager.appDidMount.call(this, ...args)
  await this.packageManager.startAsync()
}

export function appWillMount(app, ...args) {
  const { runtime } = this

  const packageManager = (this.packageManager = runtime.feature('package-manager'))

  fileManager.appWillMount.call(this, app, ...args)

  app.get('/api/package-manager', (req, res) => {
    res.json({
      packageIds: packageManager.packageIds,
    })
  })

  app.get('/api/package-manager/package/*', (req, res) => {
    const id = req.params['0']
    const pkg = packageManager.findByName(id)
    pkg ? res.json(pkg) : res.status(404).json({ error: true, notFound: true, id })
  })

  return app
}
