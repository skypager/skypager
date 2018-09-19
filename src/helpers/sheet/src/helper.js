import { google } from 'googleapis'
import GoogleSpreadsheet from 'google-spreadsheet'

export function attach(runtime) {
  const { Helper } = runtime

  class Sheet extends Helper {
    static isCacheable = true
    static isObservable = true
    static allowAnonymousProviders = true
    static strictMode = false
    static google = google

    state = runtime.mobx.observable.shallowMap([['authorized', false]])

    async initialize() {
      this.hide('spreadsheet', this.createSpreadsheet())
      await this.authorize()
      await this.getInfo()

      const { pickBy, isFunction } = this.lodash

      try {
        this.applyInterface(pickBy({ ...this.provider, ...this.options }, v => isFunction(v)), {
          partial: [],
          insertOptions: false,
        })
      } catch (error) {
        this.runtime.error(`Error while applying sheet interface`, error.message)
      }

      return this.authorized
    }

    get google() {
      return google
    }

    async loadAll(options = {}) {
      const { omit, fromPairs, mapKeys } = this.lodash

      const sanitize = rows =>
        rows.map(r =>
          mapKeys(omit(r, 'id', '_xml', '_links', 'app:edited', 'save', 'del'), (v, k) =>
            k.replace(/-/g, '_')
          )
        )

      const results = await Promise.all(
        this.spreadsheet.worksheets.map(ws => this.getRows(ws).then(r => [ws.title, sanitize(r)]))
      )

      return fromPairs(results)
    }

    createSpreadsheet(options = {}) {
      if (typeof options === 'string') {
        options = { sheetId: options }
      }

      const { sheetId = this.options.sheetId || this.provider.sheetId } = options

      return new GoogleSpreadsheet(sheetId)
    }

    async getInfo() {
      const info = new Promise((resolve, reject) => {
        this.spreadsheet.getInfo((err, info) => (err ? reject(err) : resolve(info)))
      })

      this.state.set('info', info)

      return info
    }

    async getRows(worksheet, options = {}) {
      if (typeof worksheet === 'string') {
        worksheet = { id: worksheet }
      }

      const hasRows = worksheet.getRows && typeof worksheet.getRows === 'function'

      return new Promise((resolve, reject) => {
        if (hasRows) {
          worksheet.getRows(
            { offset: 1, ...options },
            (err, rows) => (err ? reject(err) : resolve(rows))
          )
        } else {
          this.spreadsheet.getRows(worksheet.id, (err, rows) => (err ? reject(err) : resolve(rows)))
        }
      })
    }

    /*
    async addWorksheet(...args) {
      return new Promise((resolve, reject) => {
        this.spreadsheet.addWorksheet(
          ...args.push((err, ...resp) => (err ? reject(err) : resolve(...resp)))
        )
      })
    }

    async removeWorksheet(...args) {
      return new Promise((resolve, reject) => {
        this.spreadsheet.removeWorksheet(
          ...args.push((err, ...resp) => (err ? reject(err) : resolve(...resp)))
        )
      })
    }

    async addRow(...args) {
      return new Promise((resolve, reject) => {
        this.spreadsheet.addRow(
          ...args.push((err, ...resp) => (err ? reject(err) : resolve(...resp)))
        )
      })
    }

    async getCells(...args) {
      return new Promise((resolve, reject) => {
        this.spreadsheet.getCells(
          ...args.push((err, ...resp) => (err ? reject(err) : resolve(...resp)))
        )
      })
    }
    */

    get authorized() {
      return !!this.state.get('authorized')
    }

    async whenReady() {
      if (!this.authorized) {
        await this.authorize()
      }

      return this
    }

    async authorize() {
      const serviceAccount = await this.runtime.fsx.readJsonAsync(
        this.runtime.google.settings.serviceAccount
      )

      const authorized = await new Promise((resolve, reject) => {
        this.spreadsheet.useServiceAccountAuth(
          serviceAccount,
          err => (err ? reject(err) : resolve(true))
        )
      })

      this.state.set('authorized', true)
      return authorized
    }

    static attach(host, options = {}) {
      Helper.attach(host, Sheet, {
        registry: Helper.createContextRegistry('sheets', {
          context: Helper.createMockContext(),
        }),
        lookupProp: 'sheet',
        registryProp: 'sheets',
        ...options,
      })

      host.sheets.applyInterface({
        async discover(options = {}) {
          if (!runtime.google) {
            runtime.feature('google').enable(options)
          }

          await runtime.google.whenReady()
          const records = await runtime.google.listSpreadsheets(options)
          const { kebabCase, camelCase } = runtime.stringUtils

          return records.map(record => {
            const id = camelCase(kebabCase(record.title.replace(/\W/g, '')))
            host.sheets.register(id, () => record)
            return id
          })
        },
      })
    }
  }

  try {
    Helper.registerHelper('sheet', () => Sheet)
    Sheet.attach(runtime)
  } catch (error) {
    runtime.setState({ sheetHelpersError: error })
    throw error
  }

  return runtime
}
