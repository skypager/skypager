import runtime, { Helper } from '@skypager/node'
import { google } from 'googleapis'
import GoogleSpreadsheet from 'google-spreadsheet'

export class Sheet extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false
  static google = google

  get data() {
    return this.state.get('data')
  }

  get info() {
    return this.state.get('info')
  }

  get worksheets() {
    return this.get('info.worksheets', [])
  }

  async initialize() {
    this.hide('state', this.runtime.mobx.observable.shallowMap([]))
    this.hide('spreadsheet', this.createSpreadsheet())

    await this.authorize()
    await this.getInfo()

    if (this.result('eagerLoaded')) {
      await this.loadAll()
    }

    this.applySheetInterface()

    return this.authorized
  }

  applySheetInterface(iface = this.sheetInterface) {
    const { isEmpty } = this.lodash
    if (!isEmpty(iface)) {
      try {
        this.applyInterface(iface, {
          partial: [],
          insertOptions: false,
        })
      } catch (error) {
        this.runtime.error(`Error while applying sheet interface`, error.message)
        this.state.set('interfaceError', error)
      }
    }
  }

  get sheetInterface() {
    const { pickBy, omit, isFunction } = this.lodash

    return omit(
      pickBy({ ...this.provider, ...this.options }, (v, k) => isFunction(v) && !this.has(k)),
      'initialize'
    )
  }

  get google() {
    return google
  }

  async loadAll(options = {}) {
    const { camelCase, kebabCase } = this.runtime.stringUtils
    const { isEmpty, mapKeys } = this.lodash

    if (!this.authorized) {
      await this.authorize()
    }

    if (isEmpty(this.info)) {
      await this.getInfo()
    }

    const { receiveData = this.options.receiveData || this.provider.receiveData } = options
    let rawData = await loadAll.call(this, options)

    rawData = mapKeys(rawData, (v, k) => camelCase(kebabCase(k)))

    if (typeof receiveData === 'function') {
      rawData = receiveData.call(this, rawData)
    }

    this.state.set('data', rawData)

    return rawData
  }

  createSpreadsheet(options = {}) {
    if (typeof options === 'string') {
      options = { sheetId: options }
    }

    const { sheetId = this.options.sheetId || this.provider.sheetId } = options

    return new GoogleSpreadsheet(sheetId)
  }

  async getInfo() {
    const info = await new Promise((resolve, reject) => {
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
        worksheet.getRows({ offset: 1, ...options }, (err, rows) =>
          err ? reject(err) : resolve(rows)
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
      this.spreadsheet.useServiceAccountAuth(serviceAccount, err =>
        err ? reject(err) : resolve(true)
      )
    })

    this.state.set('authorized', true)
    return authorized
  }

  static attach(host = runtime, options = {}) {
    Helper.attach(host, Sheet, {
      registry: Helper.createContextRegistry('sheets', {
        context: Helper.createMockContext(),
      }),
      lookupProp: 'sheet',
      registryProp: 'sheets',
      ...options,
    })

    host.sheets.applyInterface({ discover: discover.bind(host, host) }, { configurable: true })

    return host
  }
}

export async function discover(host = runtime, options = {}) {
  if (!host.google) {
    host.feature('google').enable(options)
  }

  await host.google.whenReady()
  const records = await host.google.listSpreadsheets(options)
  const { kebabCase, camelCase } = host.stringUtils

  return records.map(record => {
    const id = camelCase(kebabCase(record.title.replace(/\W/g, '')))
    host.sheets.register(id, () => record)
    return id
  })
}

export function attach(host = runtime) {
  try {
    Helper.registerHelper('sheet', () => Sheet)
    Sheet.attach(host)
  } catch (error) {
    host.setState({ sheetHelpersError: error })
    throw error
  }

  return host
}

async function loadAll(options = {}) {
  const { omit, fromPairs, mapKeys } = this.lodash

  const sanitize = rows =>
    rows.map(r =>
      mapKeys(omit(r, 'id', '_xml', '_links', 'app:edited', 'save', 'del'), (v, k) =>
        k.replace(/-/g, '_')
      )
    )

  const results = await Promise.all(
    this.worksheets.map(ws => this.getRows(ws).then(r => [ws.title, sanitize(r)]))
  )

  return fromPairs(results)
}
