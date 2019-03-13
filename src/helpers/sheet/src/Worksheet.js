import RowEntity from './RowEntity'

export default class Worksheet {
  constructor(googleWorksheet, parent) {
    this.parent = parent
    this.googleWorksheet = googleWorksheet
    this.cells = []

    this.rows = new Map()
    this.columns = new Map()
    this.matrix = new Map()

    Promise.resolve(this.indexCells()).catch(error => error)
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

  get entities() {
    const rows = Array.from(this.rows.keys()).slice(1)
    return rows.map(this.createEntity.bind(this))
  }

  createEntity(rowNumber) {
    const row = this.getCellsInRow(rowNumber)
    const { columnsMap } = this

    const attributes = row.reduce(
      (memo, cell) => ({ ...memo, [columnsMap[String(cell.col)].attribute]: cell.value }),
      {}
    )

    return new RowEntity({ attributes, row, rowNumber, columnsMap }, this.context)
  }

  get columnsMap() {
    const { mapKeys } = this.parent.runtime.lodash
    return mapKeys(this.headersMap, v => v.col)
  }

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

  getCellsInRow(rowNumber) {
    return this.rows.get(rowNumber).map(index => this.cells[index])
  }

  getCellsInColumn(columnNumber) {
    return this.columns.get(columnNumber).map(index => this.cells[index])
  }

  async getRows(options) {
    const rows = await this.parent.getRows(this.googleWorksheet.id)
    return rows
  }

  async getCells(options) {
    const cells = await this.parent.getCells(this.googleWorksheet.id, options)
    return cells
  }

  async indexCells(options = {}) {
    await indexCells(this, options)
    return this
  }
}

async function indexCells(worksheet, options = {}) {
  const cells = await worksheet.getCells()

  worksheet.cells.length = 0
  worksheet.cells.push(...cells)

  cells.forEach((cell, index) => {
    const rows = worksheet.rows.get(cell.row) || []
    const columns = worksheet.columns.get(cell.col) || []
    columns.push(index)
    rows.push(index)

    worksheet.rows.set(cell.row, rows)
    worksheet.columns.set(cell.col, columns)
    worksheet.matrix.set(`${cell.col},${cell.row}`, index)
  })

  return worksheet
}
