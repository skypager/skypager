export const history = true
export const serveStatic = true
export const cors = true

export function appWillMount(app, options = {}, context = {}) {
  const { runtime } = this
  const { isEmpty } = this.lodash
  const { colors } = runtime.cli

  app.use((req, _, next) => {
    !isEmpty(req.params)
      ? runtime.info(`${colors.green(req.method)} ${req.url}`, req.params)
      : runtime.info(`${colors.green(req.method)} ${req.url}`)
    next()
  })

  app.get('/sheets', (req, res) => {
    const data = runtime.sheets.allMembers()
    res.json(data)
  })

  app.get('/sheets/:sheetName', (req, res) => {
    const { sheetName } = req.params

    if (!sheetName || !sheetName.length || !runtime.sheets.checkKey(req.params.sheetName)) {
      res.status(404).json({ notFound: true, error: true, sheetName })
    } else {
      const sheet = runtime.sheet(sheetName)

      sheet
        .whenReady()
        .then(() => (!req.params.refresh && sheet.has('data') ? sheet.data : sheet.loadAll()))
        .then(data => res.status(200).json(data))
        .catch(error => {
          res.status(500).send('<pre>' + error.message + '\n' + error.stack + '</pre>')
        })
    }
  })

  app.get('/sheets/:sheetName/:worksheetId', (req, res) => {
    const { worksheetId, sheetName } = req.params

    if (!sheetName || !sheetName.length || !runtime.sheets.checkKey(req.params.sheetName)) {
      res.status(404).json({ notFound: true, error: true, sheetName })
    } else {
      const sheet = runtime.sheet(sheetName)

      sheet
        .whenReady()
        .then(() => (!req.params.refresh && sheet.has('data') ? sheet.data : sheet.loadAll()))
        .then(data => {
          if (worksheetId === '_info') {
            res.status(200).json(sheet.info)
          } else if (!data[worksheetId]) {
            res.status(404).send('Invalid Worksheet')
          } else {
            res.status(200).json(data[worksheetId])
          }
        })
        .catch(error => {
          res.status(500).send('<pre>' + error.message + '\n' + error.stack + '</pre>')
        })
    }
  })
}
