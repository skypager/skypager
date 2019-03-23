import RowEntity from './RowEntity'
import { enhanceObject } from '@skypager/runtime/lib/utils/properties'
import { attach as attachEmitter } from '@skypager/runtime/lib/utils/emitter'

const LETTERS = `abcdefghijklmnopqrstuvwxyz`.split('')

const letterToNumber = name => {
  const index = LETTERS.indexOf(name.toLowerCase())
  return index >= 0 ? index + 1 : parseInt(name, 10)
}

export default class Worksheet {
  constructor(googleWorksheet, parent) {
    this.parent = parent
    this.googleWorksheet = googleWorksheet

    enhanceObject(this, {
      propUtils: true,
      includeLodashMethods: false,
      includeChain: false,
    })

    attachEmitter(this)

    this.cellsMap = this.runtime.mobx.observable.shallowMap([])

    this.hide('_columns', new Map())
    this.hide('_rows', new Map())
    this.hide(`_coordinates`, new Map())
  }

  cellAt(coordinates) {
    const indexes = String(coordinates)
      .replace(/:/g, ',')
      .split(/,/)
      .map(letterToNumber)

    return this.cellsMap.get(indexes.join(':'))
  }

  get cells() {
    return Array.from(this.cellsMap.values())
  }

  /**
   * @type {Map<string,number>}
   * @readonly
   * @memberof Worksheet
   */
  get columns() {
    return this._columns
  }

  /**
   * @type {Map<string,number>}
   * @readonly
   * @memberof Worksheet
   */
  get rows() {
    return this._rows
  }

  get title() {
    return this.googleWorksheet.title
  }

  get key() {
    const { kebabCase, camelCase } = this.runtime.stringUtils
    return camelCase(kebabCase(this.title))
  }

  get runtime() {
    return this.parent.runtime
  }

  get lodash() {
    return this.runtime.lodash
  }

  get chain() {
    return this.runtime.lodash.chain(this)
  }

  get context() {
    return { runtime: this.runtime, parent: this }
  }

  /**
   * Returns the raw data rows, excluding the column header
   *
   * @readonly
   * @memberof Worksheet
   */
  get dataRows() {
    return Array.from(this.rows.keys()).slice(1)
  }

  get entities() {
    return this.dataRows.map(row => this.createEntity(row))
  }

  get RowEntity() {
    return this.parent.getEntityClass(this.googleWorksheet.id)
  }

  get autoSaveEnabled() {
    return this.parent.autoSaveEnabled
  }

  /**
   * Creates an entity from a row in the worksheet.
   *
   * A RowEntity has getters and setters for each attribute,
   * and setting one of these attributes writes it to the spreadsheet.
   *
   * @param {*} rowNumber
   * @returns {RowEntity}
   * @memberof Worksheet
   */
  createEntity(rowNumber, RowEntityClass = this.RowEntity) {
    const row = this.getCellsInRow(rowNumber)
    const { columnsMap } = this

    const attributes = row.reduce(
      (memo, cell) => ({ ...memo, [columnsMap[String(cell.col)].attribute]: cell.value }),
      {}
    )

    if (!RowEntityClass.isRowEntity) {
      throw new Error(
        `Invalid RowEntity Class.  Expected to find class.isRowEntity property that is truthy.`
      )
    }

    return new RowEntityClass({ attributes, row, rowNumber, columnsMap }, this.context)
  }

  /**
   * Maps the column headers (attribute names) to the column in the spreadsheet.
   *
   * @readonly
   * @memberof Worksheet
   */
  get columnsMap() {
    const { mapKeys } = this.parent.runtime.lodash
    return mapKeys(this.headersMap, v => v.col)
  }

  /**
   * @typedef {Object} HeaderInfo
   * @property {Number} col the column number
   * @property {String} value the raw value of the column header in the sheet
   * @property {String} attribute the javascript attribute version, camelCased
   */
  /**
   * @typedef {Object<string, HeaderInfo>} HeadersMap
   */
  /**
   * Provides information about the headers (attribute names)
   *
   *
   * @type {HeadersMap}
   * @readonly
   * @memberof Worksheet
   */
  get headersMap() {
    const { camelCase, snakeCase } = this.parent.runtime.stringUtils
    const firstRow = this.getCellsInRow(1)

    return firstRow.reduce(
      (memo, cell) => ({
        ...memo,
        [camelCase(snakeCase(cell.value))]: {
          col: cell.col,
          value: cell.value,
          attribute: camelCase(snakeCase(cell.value)),
        },
      }),
      {}
    )
  }

  /**
   * Add a row. Accepts an object whose attributeNames
   * match what we have in the headersMap
   *
   * @param {*} [entityData={}]
   * @memberof Worksheet
   */
  addRow(entityData = {}) {}
  /**
   * Get the SpreadsheetCells for a row in this worksheet
   *
   * @param {Number} rowNumber
   * @returns {Array<SpreadsheetCell>}
   * @memberof Worksheet
   */
  getCellsInRow(rowNumber) {
    const { sortBy } = this.lodash
    const keys = Array.from(this.cellsMap.keys()).filter(index => index.endsWith(`:${rowNumber}`))
    return sortBy(keys.map(key => this.cellsMap.get(key)), 'row')
  }

  /**
   * Get the SpreadsheetCells for a column in this worksheet
   *
   * @param {Number} columnNumber
   * @returns {Array<SpreadsheetCell>}
   * @memberof Worksheet
   */
  getCellsInColumn(columnNumber) {
    const { sortBy } = this.lodash
    const keys = Array.from(this.cellsMap.keys()).filter(index =>
      index.startsWith(`${columnNumber}:`)
    )
    return sortBy(keys.map(key => this.cellsMap.get(key)), 'row')
  }

  /**
   * Loads the rows from this worksheet
   *
   * @param {Object} options
   * @returns {SpreadsheetRow}
   * @memberof Worksheet
   */
  async getRows(options = {}) {
    const rows = await this.parent.getRows(this.googleWorksheet.id)
    return rows
  }

  /**
   * Loads all of the cells from the worksheet
   *
   * @param {*} options
   * @returns
   * @memberof Worksheet
   */
  async getCells(options) {
    const cells = await this.parent.getCells(this.googleWorksheet.id, options)
    return cells
  }

  /**
   * Fetches all of the cells in a worksheet and stores them in an array,
   * creates a Map for rows, and columns,
   * which tracks the index position of that cell in the cells array.
   *
   * @param {*} [options={}]
   * @returns
   * @memberof Worksheet
   */
  async indexCells(options = {}) {
    await indexCells(this, options)
    return this
  }
}

async function indexCells(worksheet, options = {}) {
  const cells = await worksheet.getCells()

  cells.forEach((cell, index) => {
    const rows = worksheet.rows.get(cell.row) || []
    const columns = worksheet.columns.get(cell.col) || []
    columns.push(index)
    rows.push(index)

    worksheet.rows.set(cell.row, rows)
    worksheet.columns.set(cell.col, columns)
    worksheet.cellsMap.set(`${cell.col}:${cell.row}`, cell)
  })

  return worksheet
}
