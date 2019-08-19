import runtime, { Feature } from '@skypager/node'
import Datastore from 'nedb'
import CollectionFeature from './collection'

runtime.features.register('file-db', () => FileDbFeature)

export function attach(runtime, options = {}) {
  runtime.features.register('file-db', () => FileDbFeature)

  runtime.feature('file-db').enable(options)
}

/**
 * The FileDb Feature is a wrapper around the nedb library which creates a neat mongodb style interface for
 * working with collections of JSON documents.
 * @export
 * @extends {Feature}
 * @class FileDbFeature
 */

/**
 * @function
 * @name FileDbFeature#hide
 * @param {String} propName
 * @param {*} value
 */

/**
 * @function
 * @name FileDbFeature#once
 * @param {String} event
 * @param {Function} callback
 */

/**
 * @function
 * @name FileDbFeature#emit
 * @param {String} event
 * @param {*} args
 */

/**
 * @property
 * @name FileDbFeature#chain
 * @type {Object<String,Function>}
 */

/**
 * @property
 * @name FileDbFeature#lodash
 * @type {Object<String,Function>}
 */

export class FileDbFeature extends Feature {
  static isCacheable = true
  static isObservable = true

  static shortcut = 'fileDb'

  initialState = {
    loaded: false,
  }

  collection(name = this.options.dbName, api = {}) {
    return this.runtime.feature('file-db/collection', {
      dbName: name,
      fileDb: this,
      api,
    })
  }
  /**
   * Returns versions of the findOne and find methods which return the response
   * wrapped in a lodash chain, which allows you to do client side transformations
   * of your queries
   *
   * @returns {ChainInterface}
   */
  get chains() {
    const db = this
    return {
      async find(...args) {
        const resp = await db.find(...args)
        return db.lodash.chain(resp)
      },
      async findOne(...args) {
        const resp = await db.findOne(...args)
        return db.lodash.chain(resp)
      },
    }
  }

  async find(query) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.find(query, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  async findOne(query) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.findOne(query, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  async count(query) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.count(query, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  async insert(query) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.insert(query, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  async patch(query, update = {}, options = {}) {
    await this.whenReady()
    const current = await this.findOne(query)

    const response = await new Promise((resolve, reject) => {
      this.db.update(query, { ...current, ...update }, options, (err, res) =>
        err ? reject(err) : resolve(res)
      )
    })

    return response
  }

  async update(query, update = {}, options = {}) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.update(query, update, options, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  async remove(query, options = {}) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.remove(query, options, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  /**
   * @param {String} fieldName
   * @param {Object} options
   * @param {Boolean} [options.unique=false]
   * @param {Boolean} [options.sparse=false]
   */
  async ensureIndex(fieldName, options) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.ensureIndex({ fieldName, ...options }, (err, res) =>
        err ? reject(err) : resolve(res)
      )
    })

    return response
  }

  /**
   * @param {String} fieldName the field name whose index you want to remove
   */
  async removeIndex(fieldName) {
    await this.whenReady()
    const response = await new Promise((resolve, reject) => {
      this.db.removeIndex(fieldName, (err, res) => (err ? reject(err) : resolve(res)))
    })

    return response
  }

  get isLoaded() {
    return !!this.state.get('loaded')
  }

  async whenReady() {
    if (this.isLoaded) {
      return this
    }

    const promise = new Promise(res => {
      this.once('dbLoaded', () => res(this))
    })

    if (this._creatingDb) {
      return promise
    } else {
      this.load()
      return promise
    }
  }

  async load(options = this.options) {
    const db = await this.createDatabase(options)
    await db.loadDatabase()
    this.state.set('loaded', true)
    this.emit('dbLoaded')
  }

  async createDatabase(options = this.dbOptions) {
    if (this.db) {
      return this.db
    }

    if (this._creatingDb) {
      return
    }

    this._creatingDb = true

    const { dbFilename, dbAutoload } = this.dbOptions

    await this.runtime.fsx.mkdirpAsync(this.runtime.pathUtils.dirname(dbFilename))

    const db = new Datastore({ filename: dbFilename, autoload: false })

    if (dbAutoload) {
      await db.loadDatabase()
      this.state.set('dbLoaded', true)
      this.emit('dbLoaded')
    }

    /** @type {Datastore} */
    this.db = db
    this.hide('db', db)

    delete this._creatingDb

    return db
  }

  /**
   * @returns {Object}
   */
  get options() {
    return super.options
  }

  /**
   * @returns {Runtime}
   */
  get runtime() {
    return super.runtime
  }

  get dbOptions() {
    const {
      dbName = this.runtime.name,
      dbFilename = this.runtime.resolve('db', `${dbName}.${this.runtime.env}.db`),
      dbAutoload = false,
    } = this.options

    return {
      dbName,
      dbFilename,
      dbAutoload,
    }
  }
}

export default FileDbFeature

/**
 * @typedef {Object<String,Function>} ChainInterface
 * @property {Function} findOne
 * @property {Function} find
 */

/**
 * @typedef {Object} PathUtils
 * @property {Function} dirname
 */

/**
 * @typedef {Object} Runtime
 * @property {PathUtils} pathUtils
 * @property {Function} resolve
 * @property {String} name
 * @property {String} env
 */

/**
 * @interface PropUtils
 * @property {Function} hide
 */
