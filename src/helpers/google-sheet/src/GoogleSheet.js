import runtime, { Helper } from '@skypager/node'
import { google } from 'googleapis'
import GoogleSpreadsheet from 'google-spreadsheet'
import Worksheet from './Worksheet'
import RowEntity from './RowEntity'

/**
 * The GoogleSheet Helper represents an individual google spreadsheet document as a stateful JavaScript module.
 *
 * You can access all of the individual worksheets in the spreadsheet, as well as all columns and rows in the worksheet.  You can set values or formulas, create new worksheets, etc.
 *
 * Each individual instance of the spreadsheet has a registry of RowEntity classes specific to each worksheet.  These RowEntity objects have getters and setters for all of the column names.
 *
 * You can subclass RowEntity with a specific class for that worksheet, and assign that subclass to the worksheet.  This allows you to build ORM like applications on top not only that google spreadsheet,
 * but relationally across all of the google spreadsheets you have in the GoogleSheet helper registry.
 */
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

  /**
   * Gets a value by name from the helper options (an object you pass at creation time), and if that does not exist,
   * it checks the provider (whatever object gets registered with the sheets registry).  If that does not exist,
   * will return the defaultValueOrFunction argument.  If that argument is a function, it will call it first and return the result.
   *
   * @param {String} attribute
   * @param {*} defaultValueOrFunction
   */
  tryResult(attribute, defaultValueOrFunction) {
    return super.tryResult(attribute, defaultValueOrFunction)
  }

  /**
   * Gets a value by name from the helper options (an object you pass at creation time), and if that does not exist,
   * it checks the provider (whatever object gets registered with the sheets registry).  If that does not exist,
   * will return the defaultValueOrFunction argument.  If that argument is a function, it will call it first and return the result.
   *
   * @param {String} attribute
   * @param {*} defaultValue
   */
  tryGet(attribute, defaultValueOrFunction) {
    return super.tryGet(attribute, defaultValueOrFunction)
  }

  /**
   * The sheetId is the unique id component of the google spreadsheet URL.
   * @type {String}
   */
  get sheetId() {
    return this.tryResult('sheetId', this.tryResult('sheetId', this.provider.id))
  }

  /**
   * The RowEntity class is a dynamically generated class which contains getters and setters for all of the column names.  The setters can be
   * set up to autosave the value to the underlying row / cell in the worksheet represented by that RowEntity and the attribute you're setting.
   *
   * @type {Function}
   */
  get RowEntity() {
    return this.tryGet('RowEntity', RowEntity)
  }

  /**
   * The sheet data is an object, keyed by worksheet title.  The values are arrays of objects representing all of the data in the sheet.  The keys of the row level objects,
   * will match the column heading values entered on row 1.
   *
   * @type {Object<String,Array<Object>>}
   */
  get data() {
    return this.state.get('data')
  }

  /**
   * @type {SpreadsheetInfo}
   */
  get info() {
    return this.state.get('info')
  }

  /**
   * @type {Array<SpreadsheetWorksheet>}
   */
  get worksheets() {
    return this.get('info.worksheets', [])
  }

  /**
   * @type {GoogleSpreadsheet}
   */
  get spreadsheet() {
    return this._spreadsheet
  }

  /**
   * @type {Map}
   */
  get worksheetsIndex() {
    return this._worksheetsIndex
  }

  /**
   * @type {Runtime}
   */
  get runtime() {
    return super.runtime
  }

  /**
   * The initialize lifeCycle hook takes care of setting up the sheet helper instance
   * with the different indexes / maps that keep track of the worksheets and rows.
   *
   * If eagerLoaded is passed as an option to the helper, or if the provider that is registered
   * with the sheets registry defines an eagerLoaded attribute that is truthy, then the initialize
   * hook will automatically load all the data.
   *
   * Applies the sheet interface, if functions were passed as options or in the provider.
   *
   * Will call an initialize function if defined as an option or in the provider.
   *
   * @private
   */
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
   * @param {String} sheetName
   * @param {Function} fn
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

  /**
   * Gets the RowEntity class responsible for representing rows in the given worksheet title.
   *
   * @param {String} sheetName the title of the sheet
   * @returns {Function}
   */
  getEntityClass(sheetName) {
    const sheetId = this.findSheetId(sheetName)
    return this.entityHandlers.get(sheetId) || this.RowEntity
  }

  /**
   * entityHandlers is a Map whose keys are the titles of this spreadsheet's worksheets,
   * and whose values are RowEntity subclasses (or models) to use to represent each row as an ActiveRecord like object.
   */
  get entityHandlers() {
    return this._entityHandlers
  }

  /**
   * Returns true if the autoSave behavior is enabled for RowEntity setters
   * @type {Boolean}
   */
  get autoSaveEnabled() {
    return !!this.state.get('autoSave')
  }

  /**
   * Enable the autoSave behavior on RowEntity setters.
   */
  enableAutoSave() {
    this.state.set('autoSave', true)
    return true
  }

  /**
   * Disable the autoSave behavior on RowEntity setters.
   */
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

  /**
   * Creates instances of RowEntity for every sheet.
   *
   * Returns an object whose keys are the sheetTitles, and whose values are arrays of the RowEntity objects
   * representing each row in that sheet.  If you have registered a custom RowEntity class, it will use that class instead
   * of the generic RowEntity class.
   *
   * @returns {Promise<Object<String,Array<RowEntity>>>}
   */
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

  /**
   * Create an instance of our Worksheet wrapper for a the given sheet title,
   * after indexing each cell.  This prepares the Worksheet wrapper to work with
   * RowEntity objects which can enable auto-save whenever their javascript object value is set.
   *
   * @param {String} worksheetTitle
   * @returns {Promise<Worksheet>}
   */
  async ws(worksheetTitle) {
    const sheet = this.sheet(worksheetTitle)
    await sheet.indexCells()
    return sheet
  }

  /**
   * Creates an instance of ouf Worksheet wrapper once, for the given sheet title.  Subsequent calls
   * for the same title will return the same object.
   *
   * @returns {Worksheet}
   */

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

  /**
   * Applies an interface module to this instance of the GoogleSheet.  Will not effect other instances.
   *
   * An interface module is just an object of functions.  These functions will be bound to the instance
   * of the sheet, so your functions can refer to a `this`.  These interface modules are a way of developing
   * abstractions for performing various tasks using the sheet.  You could have functions which reduce all of the data
   * and present them in some other form.  (What you might otherwise use formulas for in excel.)  You can have functions
   * which write data to multiple sheets, or even different sheets.
   *
   * Interface module function names that start with the word get will be treated as getters.
   *
   * Interface module function names that start with the word lazy will be treated as getters, and only run once.
   */
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

  /**
   * The sheetInterface can be a part of a JavaScript module that you register with the GoogleSheet helper registry,
   * or it can be passed in as an object when you create an instance of the sheet helper with the runtime.sheet factory function.
   *
   * Any function you export from that module, or pass in as options at create time, will be a part of the interface.
   *
   * Interface module function names that start with the word get will be treated as getters.
   *
   * Interface module function names that start with the word lazy will be treated as getters, and only run once.
   *
   * @type {Object<String,Function>}
   */
  get sheetInterface() {
    const { pickBy, omit, isFunction } = this.lodash

    return omit(
      pickBy({ ...this.provider, ...this.options }, (v, k) => isFunction(v) && !this.has(k)),
      'initialize'
    )
  }

  /**
   * Provides low level access to the googleapis module from npm.  These will be authenticated using the service account.
   */
  get google() {
    return google
  }

  /**
   * Loads the sheet info and all of the data.
   *
   * @param {Object} options
   * @param {Function} [options.receiveData] a function that you can use to transform the data before it gets cached in memory.
   * @returns {Promise<Object>}
   */
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

  /**
   * Creates a new instance of the GoogleSpreadsheet class provided by the node-googlespreadsheet package on npm
   *
   * @param {Object} options
   * @param {String} options.sheetId
   * @returns {GoogleSpreadsheet}
   */
  createSpreadsheet(options = {}) {
    if (typeof options === 'string') {
      options = { sheetId: String(options) }
    }

    const { sheetId = this.options.sheetId || this.provider.sheetId } = options

    return new GoogleSpreadsheet(sheetId)
  }

  /**
   * Gets document level metadata about this google spreadsheet.
   *
   * @return {Promise<SpreadsheetInfo>}
   */
  async getInfo() {
    const info = await new Promise((resolve, reject) => {
      this.spreadsheet.getInfo((err, info) => (err ? reject(err) : resolve(info)))
    })

    this.state.set('info', info)

    return info
  }

  /**
   * Returns the rows for a particular worksheet, or worksheet id.
   *
   * @param {String|SpreadsheetWorksheet} worksheet
   * @param {Object} options
   * @return {Promise<Array>}
   */
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

  /**
   * Returns the cells for a particular worksheet, or worksheet id.
   *
   * @param {String|SpreadsheetWorksheet} worksheet
   * @param {Object} options
   * @return {Promise<Array>}
   */

  async getCells(worksheet, options = {}) {
    if (typeof worksheet === 'string') {
      worksheet = { id: worksheet }
    }

    worksheet.id = this.findSheetId(worksheet.id)

    return new Promise((resolve, reject) => {
      this.spreadsheet.getCells(worksheet.id, (err, cells) => (err ? reject(err) : resolve(cells)))
    })
  }

  /**
   * Bulk update multiple cells in a particular worksheet, or worksheet id.
   *
   * @param {String|SpreadsheetWorksheet} worksheet
   * @param {Array<{ column: number, row: number, value: string }>}
   */
  async bulkUpdateCells(worksheet, cells = []) {
    if (typeof worksheet === 'string') {
      worksheet = { id: worksheet }
    }

    worksheet.id = this.findSheetId(worksheet.id)

    return new Promise((resolve, reject) => {
      this.spreadsheet.bulkUpdateCells(worksheet.id, cells, err => (err ? reject(err) : resolve()))
    })
  }

  /**
   * Given a name or id, resolve to a real value of the underlying worksheet id, which is used to reference worksheets with the google-spreadsheet module
   *
   * @param {String} alias worksheet id or title
   * @param {Boolean} [errorOnMissing=false] throw an error if the worksheet is not found
   * @returns {String}
   */
  findSheetId(alias, errorOnMissing = String(process.env.ERROR_ON_MISSING_SHEET) === 'true') {
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

  /**
   * Add a row to a particular sheet
   *
   * @param {String} worksheetId
   * @param {Object} rowData
   */
  async addRow(worksheetId, rowData = {}) {
    worksheetId = this.findSheetId(String(worksheetId))

    return new Promise((resolve, reject) => {
      this.spreadsheet.addRow(worksheetId, rowData, (err, row) =>
        err ? reject(err) : resolve(row)
      )
    })
  }

  /**
   * Create a new worksheet.
   *
   * @param {Object} options
   * @param {String} [options.title='mySheet']
   * @param {Array<String>} [options.headers=[]]
   * @param {Number} [options.colCount]
   * @param {Number} [options.rowCount=50]
   */

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

  /**
   * Remove a worksheet.
   *
   * @param {String|Number} sheetOrSheetIdOrIndex the worksheet, its id, or its numeric index
   */
  async removeWorksheet(sheetOrSheetIdOrIndex) {
    return new Promise((resolve, reject) => {
      this.spreadsheet.removeWorksheet(sheetOrSheetIdOrIndex, err =>
        err ? reject(err) : resolve(true)
      )
    })
  }

  /**
   * Returns true if the service account is authorized to edit the sheet
   *
   * @type {Boolean}
   */
  get authorized() {
    return !!this.state.get('authorized')
  }

  /**
   * Returns true once the worksheets have been loaded and their data has been collected.
   *
   * @type {Boolean}
   */
  get isReady() {
    return this.authorized && !!this.state.get('ready')
  }

  /**
   * Returns a promise which will resolve when the sheet becomes ready.
   * @returns {Promise}
   */
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

  /**
   * Authorize this sheet to talk to the google drive / sheets APIs
   * by using the configured service account.
   *
   * @param {String|Object} serviceAccountPathOrJSON the absolute path to the service account json file, or
   * the serviceAccount JSON Object itself.
   *
   * @returns {Promise<Boolean>}
   */
  async authorize(options = {}) {
    const { google } = this.runtime
    const { auth = this.tryGet('auth') } = options

    let authorized

    if (!auth) {
      const serviceAccount = await this.runtime.fsx.readJsonAsync(google.settings.serviceAccount)
      const serverAuth = await new Promise((resolve, reject) => {
        this.spreadsheet.useServiceAccountAuth(serviceAccount, err =>
          err ? reject(err) : resolve(true)
        )
      })

      authorized = !!serverAuth
    } else if (auth && auth.credentials) {
      await this.spreadsheet.setAuthToken({
        type: auth.credentials.token_type,
        value: auth.credentials.access_token,
        expires: auth.credentials.expiry_date
      })
      authorized = true
    }

    setTimeout(() => {
      this.state.set('authorized', !!authorized)
    }, 100)

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

export { RowEntity }

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

/**
 * @typedef {Object} SpreadsheetInfo
 * @property {String} id
 * @property {String} title
 * @property {Object<String,String>} author
 * @property {Array<SpreadsheetWorksheet>} worksheets
 */

/**
 * @typedef {Object} SpreadsheetWorksheet
 * @property {String} id
 * @property {String} url
 * @property {String} title
 * @property {Number} rowCount
 * @property {Number} colCount
 * @property {Function} getRows
 * @property {Function} getCells
 * @property {Function} addRow
 * @property {Function} bulkUpdateCells
 * @property {Function} del
 * @property {Function} setHeaderRow
 *
 */

/**
 * @typedef {Object} Runtime
 * @property {Object} currentState
 * @property {GoogleFeature} google
 * @property {Object} state
 */

/**
 * @typedef {Object} GoogleFeature
 * @property {Object} settings
 * @property {Object} apis
 * @property {Boolean} hasErrors
 * @property {Function} whenReady
 */
