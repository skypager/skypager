import runtime, { Helper } from '@skypager/node'
import { google } from 'googleapis'
import GoogleSpreadsheet from 'google-spreadsheet'
import Worksheet from './Worksheet'
import RowEntity from './RowEntity'

export class GoogleSheet extends Helper {
  static isCacheable = true
  static isObservable = true
  static allowAnonymousProviders = true
  static strictMode = false
  static google = google

  static RowEntity = RowEntity

  initialState = {
    ready: false,
    autoSave: false,
    data: {},
    info: {},
  }

  get sheetId() {
    return this.tryResult('sheetId', this.tryResult('sheetId', this.provider.id))
  }

  get RowEntity() {
    return this.tryGet('RowEntity', RowEntity)
  }

  get data() {
    return this.state.get('data')
  }

  get info() {
    return this.state.get('info')
  }

  get worksheets() {
    return this.get('info.worksheets', [])
  }

  get spreadsheet() {
    return this._spreadsheet
  }

  get worksheetsIndex() {
    return this._worksheetsIndex
  }

  get runtime() {
    return super.runtime
  }

  async initialize() {
    this.hide('_spreadsheet', (this._spreadsheet = this.createSpreadsheet()))
    this.hide('_worksheetsIndex', (this._worksheetsIndex = new Map()))
    this.hide('_entityHandlers', (this._entityHandlers = new Map()))

    await this.authorize()
    await this.getInfo()

    if (this.result('eagerLoaded')) {
      await this.loadAll()
    }

    this.applySheetInterface()

    const { initialize = this.provider.initialize } = this.options

    if (typeof initialize === 'function') {
      await initialize.call(this, this.options, this.context)
    }

    return this.authorized
  }

  /**
   * Provides an Entity class to represent a row in one of your sheets.
   *
   * For example, if you have a google spreadsheet with two worksheets: products, stock
   *
   * You can define a class Product which extends our generic RowEntity, that has a getter method
   * isInStock that allows a product entity (a row from your products sheet) to reference an attribute
   * of a related row in the stock table.
   *
   * @example
   *
   * sheet.registerEntity('products', ({ RowEntity, sheet }) => {
   *   class Product extends RowEntity {
   *     get isInStock() {
   *       sheet.parent.sheet('stock').findByProductId(this.productId).stockLevel > 0
   *     }
   *   }
   *
   *   return Product
   * })
   *
   * @param {*} sheetName
   * @param {*} fn
   * @memberof Sheet
   */
  registerEntity(sheetName, fn) {
    const reg = () => {
      const sheetId = this.findSheetId(sheetName)
      const EntityClass = fn && fn.isRowEntity ? fn : fn(this.RowEntity)
      this.entityHandlers.set(sheetId, EntityClass)
      return EntityClass
    }

    if (!this.isReady) {
      return this.whenReady().then(() => reg())
    }

    return reg()
  }

  getEntityClass(sheetName) {
    const sheetId = this.findSheetId(sheetName)
    return this.entityHandlers.get(sheetId) || this.RowEntity
  }

  get entityHandlers() {
    return this._entityHandlers
  }

  get autoSaveEnabled() {
    return !!this.state.get('autoSave')
  }

  enableAutoSave() {
    this.state.set('autoSave', true)
    return true
  }

  disableAutoSave() {
    this.state.set('autoSave', false)
    return false
  }

  /**
   * Gets the Worksheet class that represents one of the worksheets in the google spreadsheet.
   *
   * @readonly
   * @memberof Sheet
   * @type {Array<Worksheet>}
   */
  get sheets() {
    return this.worksheets.map(ws => this.sheet(ws.id))
  }

  /**
   * Gets the internal worksheet ids for the worksheets in this google spreadsheet.
   *
   * @readonly
   * @memberof Sheet
   * @type {Array<String>}
   */
  get worksheetIds() {
    return this.worksheets.map(w => w.id)
  }

  /**
   * Gets the worksheet titles for the worksheets in this google spreadsheet.
   *
   * @readonly
   * @memberof Sheet
   * @type {Array<String>}
   */
  get worksheetTitles() {
    return this.worksheets.map(w => w.title)
  }

  async allEntities() {
    const entities = {}
    const sheets = this.sheets

    await Promise.all(
      sheets.map(sheet =>
        sheet.indexCells().then(sheet => {
          entities[sheet.key] = sheet.entities
        })
      )
    )

    return entities
  }

  async ws(worksheetTitle) {
    const sheet = this.sheet(worksheetTitle)
    await sheet.indexCells()
    return sheet
  }

  sheet(worksheetTitle) {
    const key = this.findSheetId(String(worksheetTitle).toLowerCase())

    if (this.worksheetsIndex.has(key)) {
      return this.worksheetsIndex.get(key)
    }

    const ws =
      this.worksheets.find(
        ws =>
          String(ws.title).toLowerCase() === String(worksheetTitle).toLowerCase() || ws.id === key
      ) || this.worksheets[0]

    const worksheet = new Worksheet(ws, this)

    this.worksheetsIndex.set(key, worksheet)

    return worksheet
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
    let rawData = await loadRawDataFromSheet.call(this, options)

    rawData = mapKeys(rawData, (v, k) => camelCase(kebabCase(k)))

    if (typeof receiveData === 'function') {
      rawData = receiveData.call(this, rawData)
    }

    this.state.set('ready', true)
    this.state.set('data', rawData)

    this.emit('ready')

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
      worksheet.id = this.findSheetId(worksheet.id)
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

  async getCells(worksheet, options = {}) {
    if (typeof worksheet === 'string') {
      worksheet = { id: worksheet }
    }

    worksheet.id = this.findSheetId(worksheet.id)

    return new Promise((resolve, reject) => {
      this.spreadsheet.getCells(worksheet.id, (err, cells) => (err ? reject(err) : resolve(cells)))
    })
  }

  async bulkUpdateCells(worksheet, cells = []) {
    if (typeof worksheet === 'string') {
      worksheet = { id: worksheet }
    }

    worksheet.id = this.findSheetId(worksheet.id)

    return new Promise((resolve, reject) => {
      this.spreadsheet.bulkUpdateCells(worksheet.id, cells, err => (err ? reject(err) : resolve()))
    })
  }

  findSheetId(alias, errorOnMissing = false) {
    const ws = this.worksheets
      .filter(Boolean)
      .find(
        ws =>
          String(ws.title).toLowerCase() === String(alias).toLowerCase() ||
          String(ws.id).toLowerCase() === String(alias).toLowerCase()
      )

    if (!ws && errorOnMissing === true) {
      throw new Error(
        `Could not find worksheet using ${alias}. Worksheet IDs: ${this.worksheetIds.join(
          ','
        )} Sheet Titles: ${this.worksheetTitles.join(',')}`
      )
    }

    return ws && ws.id
  }

  async addRow(worksheetId, rowData) {
    worksheetId = this.findSheetId(String(worksheetId))

    return new Promise((resolve, reject) => {
      this.spreadsheet.addRow(worksheetId, rowData, (err, row) =>
        err ? reject(err) : resolve(row)
      )
    })
  }

  async addWorksheet({
    title = 'mySheet',
    rowCount = 50,
    headers = [],
    colCount = headers.length,
  } = {}) {
    return new Promise((resolve, reject) => {
      this.spreadsheet.addWorksheet({ title, headers, rowCount, colCount }, (err, worksheet) =>
        err ? reject(err) : resolve(worksheet)
      )
    })
  }

  async removeWorksheet(sheetOrSheetIdOrIndex) {
    return new Promise((resolve, reject) => {
      this.spreadsheet.removeWorksheet(sheetOrSheetIdOrIndex, err =>
        err ? reject(err) : resolve(true)
      )
    })
  }

  get authorized() {
    return !!this.state.get('authorized')
  }

  get isReady() {
    return this.authorized && !!this.state.get('ready')
  }

  async whenReady() {
    if (this.isReady) {
      return this
    }

    if (!this.authorized) {
      await this.authorize()
    }

    this.loadAll()

    await new Promise((resolve, reject) => {
      this.once('ready', () => resolve())
    })

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
    Helper.attach(host, GoogleSheet, {
      registry: Helper.createContextRegistry('sheets', {
        context: Helper.createMockContext(),
      }),
      lookupProp: 'sheet',
      registryProp: 'sheets',
      ...options,
    })

    host.googleSheet = host.sheet.bind(host)
    host.getter('googleSheets', () => host.sheets)

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
    const id = camelCase(kebabCase(record.title.replace(/\s+/, '-').replace(/\W/g, '')))
    host.sheets.register(id, () => record)
    return id
  })
}

export function attach(host = runtime) {
  try {
    Helper.registerHelper('sheet', () => GoogleSheet)
    GoogleSheet.attach(host)
  } catch (error) {
    host.setState({ sheetHelpersError: error })
    throw error
  }

  return host
}

async function loadRawDataFromSheet(options = {}) {
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
