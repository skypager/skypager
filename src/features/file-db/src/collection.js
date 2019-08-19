import runtime, { Feature } from '@skypager/node'

if (!runtime.features.checkKey('file-db/collection')) {
  runtime.use({ attach })
}

export function attach(runtime, options = {}) {
  runtime.features.register('file-db/collection', () => FileDbCollectionFeature)
}

export class FileDbCollectionFeature extends Feature {
  static isCacheable = true
  static isObservable = true

  initialState = {
    loaded: false,
  }

  get db() {
    const { fileDb = this.fileDb, dbName } = this.options

    if (fileDb) {
      return fileDb
    }

    const db = this.runtime.feature('file-db', {
      ...this.options,
      dbName,
      cacheHelper: false,
    })

    this.hide('fileDb', db)

    return db
  }

  find(...args) {
    return this.db.find(...args)
  }
  findOne(...args) {
    return this.db.findOne(...args)
  }
  insert(...args) {
    return this.db.insert(...args)
  }
  update(...args) {
    return this.db.update(...args)
  }
  patch(...args) {
    return this.db.patch(...args)
  }
  remove(...args) {
    return this.db.remove(...args)
  }

  afterInitialize() {
    const { api = {} } = this.options

    this.applyInterface(api, { transformKeys: true, partial: [] })

    Promise.resolve(this.db.load())

    return true
  }
}

export default FileDbCollectionFeature
