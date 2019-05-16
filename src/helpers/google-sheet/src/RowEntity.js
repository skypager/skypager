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
  static isRowEntity = true

  constructor(data = {}, context = {}) {
    Object.defineProperty(this, '__row', {
      value: new RowWrapper(data, {
        runtime: context.runtime,
        parent: context.parent,
      }),
      enumerable: false,
    })

    Object.defineProperty(this, '__context', {
      value: context,
      enumerable: false,
    })

    Object.defineProperty(this, '__autoSave', {
      value: !!context.parent.autoSaveEnabled,
      enumerable: false,
      configurable: true,
      writable: true,
    })

    this.lodash
      .values(this.row.columnsMap)
      .map(({ attribute }) => this.createGettersAndSetters(attribute))
  }

  enableAutoSave() {
    return (this.__autoSave = true)
  }

  disableAutoSave() {
    return (this.__autoSave = false)
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
        if (cell) {
          cell.value = newValue
          if (this.__autoSave) {
            this.parent.runtime.debug(`Autosaving sheet entity`, {
              newValue,
              attributeName,
              cell: cell.id,
            })
          }
        } else {
          this.parent.runtime.warn(
            `Attempt to set ${attributeName} failed. not found in attributesToCellsMap`,
            Object.keys(entity.attributesToCellsMap)
          )
        }
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
    return this.__row
  }

  get rowId() {
    return [this.parent.googleWorksheet.id, this.row.rowNumber].join('::')
  }

  get hash() {
    return this.runtime.hashObject(this.toJSON())
  }

  get context() {
    return this.__context
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
