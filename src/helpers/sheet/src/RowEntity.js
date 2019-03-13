class RowWrapper {
  constructor({ attributes = {}, row = [], rowNumber = 2, columnsMap = {} }, { runtime, parent }) {
    this.attributes = attributes
    this.row = row
    this.runtime = runtime
    this.parent = parent
    this.rowNumber = rowNumber
    this.columnsMap = columnsMap
  }
}

export default class RowEntity {
  constructor(data = {}, context = {}) {
    Object.defineProperty(this, '_row', {
      value: new RowWrapper(data, {
        runtime: context.runtime,
        parent: context.parent,
      }),
      enumerable: false,
    })

    Object.defineProperty(this, '_context', {
      value: context,
      enumerable: false,
    })

    this.lodash
      .values(this.row.columnsMap)
      .map(({ attribute }) => this.createGettersAndSetters(attribute))
  }

  createGettersAndSetters(attributeName) {
    const entity = this

    Object.defineProperty(this, attributeName, {
      configurable: true,
      enumerable: true,
      get: () => {
        const cell = entity.attributesToCellsMap[attributeName]
        return cell && cell.value
      },
      set: newValue => {
        const cell = entity.attributesToCellsMap[attributeName]
        cell.value = newValue
        cell.save()
        return newValue
      },
    })
  }

  toJSON() {
    const { row, columnsMap } = this.row

    const attributes = row.reduce(
      (memo, cell) => ({
        ...memo,
        [columnsMap[String(cell.col)].attribute]: cell.value,
      }),
      {}
    )

    return attributes
  }

  get attributesToCellsMap() {
    const { values } = this.lodash
    const { columnsMap } = this.row
    const columns = values(columnsMap)
    const cells = this.row.row

    return columns.reduce(
      (memo, col) => ({
        ...memo,
        [col.attribute]: cells.find(cell => cell.col === col.col),
      }),
      {}
    )
  }

  get row() {
    return this._row
  }

  get rowId() {
    return [this.parent.googleWorksheet.id, this.row.rowNumber].join('::')
  }

  get hash() {
    return this.runtime.hashObject(this.toJSON())
  }

  get context() {
    return this._context
  }

  get parent() {
    return this.context.parent
  }

  get runtime() {
    return this.context.runtime
  }

  get lodash() {
    return this.runtime.lodash
  }
}
