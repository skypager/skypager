export const pretty = true

export async function appDidMount() {
  this.runtime.debug('app did mount hook')
  const fileManager = this.tryResult('fileManager', () => this.runtime.fileManager)
  this.runtime.debug('starting file manager')
  await fileManager.startAsync()
  await fileManager.syncMemoryFileSystem({
    fallback: true,
    content: true,
    hash: true,
  })
  this.runtime.debug('file manager started')
  this.fm = fileManager
  return true
}

export function appWillMount(app) {
  this.runtime.debug('app will mount')
  const fm = this.tryResult('fileManager', () => this.runtime.fileManager)

  this.runtime.debug({ fm: fm.uuid, runtime: this.runtime.uuid })

  const cleanPath = realPath => realPath.replace(this.runtime.cwd, '~')

  app.get('/api/file-manager', (req, res) => {
    try {
      res.json({
        fileIds: fm.fileIds,
        directoryIds: fm.directoryIds,
      })
    } catch (error) {
      console.error(error)
    }
  })

  app.get(`/api/file-manager/*`, (req, res) => {
    const id = req.params['0']
    if (fm.files.has(id)) {
      const file = fm.files.get(id)
      res.json({
        ...file,
        path: cleanPath(file.path),
        dir: cleanPath(file.dir),
      })
    } else if (fm.directories.has(id)) {
      const dir = fm.directories.get(id)
      res.json({
        ...dir,
        path: cleanPath(dir.path),
        dir: cleanPath(dir.dir),
        root: '~',
        children: {
          files: fm.fileIds.filter(f => f.startsWith(dir.relative)),
          directories: fm.directoryIds.filter(
            f => dir.relative !== f && f.startsWith(dir.relative)
          ),
        },
      })
    } else {
      res.status(404).send({ error: true, notFound: true, id })
    }
  })
}
