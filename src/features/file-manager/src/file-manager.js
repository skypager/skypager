import pathMatcher from '@skypager/runtime/lib/utils/path-matcher'
import { applyRoute } from '@skypager/runtime/lib/utils/router'
import md5File from 'md5-file'
import * as computedProperties from './file-manager/computed'
import * as actions from './file-manager/actions'
import Promise from 'bluebird'
import Memory from 'memory-fs'
export const createGetter = 'fileManager'

export function observables(options = {}) {
  return {
    status: CREATED,
  }
}

export const featureMethods = [
  // A Mobx Observable Map of file metadata
  'getFiles',

  'getLifeCycleHooks',

  'getStatuses',

  // A Mobx Observable Map of directory metadata
  'getDirectories',

  // A Mobx Observable Map of Git Tree Status
  'getStatusMap',

  // Loads all of the files
  'start',

  // Loads all of the files
  'startAsync',

  // Get access to the git wrapper
  'getGit',

  // A Utility for testing a path with a rule or set of rules
  'getPathMatcher',

  'applyRouteMetadata',

  'matchRoute',

  'matchPaths',

  'matchPatterns',

  'selectMatches',

  // Read an md5 hash of a file
  'hashFile',

  'hashBuildTree',

  // Read the md5 hash of all files within a given tree
  'hashFiles',

  // compute a hash of the selected files
  'computeHash',

  // Read the content of all files within a given subtree
  'readAllContent',

  // Access to all of the observable file paths
  'getFileIds',
  'getFilePaths',

  // Access to all of the observable directory paths
  'getDirectoryIds',

  // Access to all of the observable directory objects
  'getDirectoryObjects',

  // Access to all of the observable file objects
  'getFileObjects',

  // Access to all of the observable file paths with a modified git status
  'getModifiedFiles',

  // Access to all of the observable directory paths with modified files in them
  'getModifiedDirectories',

  // Access to chained wrappers of our observables
  'getChains',

  // A Promise which will resolve immediately, or whenever the filemanager is active.
  // Will attempt to activate the file manager if it wasn't already done
  'whenActivated',

  // A Promise which will resolve immediately, or whenever the filemanager is active
  'activationEventWasFired',

  // Sync the memory file system
  'lazyMemoryFileSystem',

  'createMemoryFileSystem',

  'syncMemoryFileSystem',

  'wrapMemoryFileSystem',

  'file',

  'getPackages',

  'getPackageManager',

  'walkUp',

  'walkUpSync',

  'updateFileContent',

  'updateFileHash',

  'hashTree',
]

export const hostMethods = ['requireContext']

export const hostMixinOptions = {
  partial: [],
  injectOptions: false,
}

export function requireContext(rule, options = {}) {
  const { requireFn = require, keyBy = 'name', mapValues = 'path', formatId } = options

  if (!this.fileManager) {
    throw new Error(`The Require Context feature depends on the file-manager feature.`)
  }

  if (this.fileManager.status !== READY) {
    throw new Error(`Please wait until the fileManager is ready to use this feature`)
  }

  return this.chain
    .invoke('fileManager.selectMatches', rule)
    .keyBy(keyBy)
    .mapKeys((v, k) => (formatId ? formatId(k, v) : k))
    .mapValues(mapValues)
    .thru(map => {
      const req = key => requireFn(map[key])

      return Object.assign(req, {
        resolve(key) {
          return map[key]
        },
        keys() {
          return Object.keys(map)
        },
      })
    })
    .value()
}

export async function hashTree() {
  await this.hashFiles({ include: [/.*/] })
  const sortedHashTable = this.chain
    .get('fileObjects')
    .sortBy('relative')
    .map(file => ({ id: file.relative, hash: file.hash }))
    .value()
  return this.runtime.hashObject(sortedHashTable)
}

const normalize = path => path.replace(/\\\\?/g, '/')

export function file(options = {}) {
  const { runtime } = this

  if (typeof options === 'string') {
    options = { id: options }
  }

  const { id } = options
  const foundById = this.files.get(normalize(id))

  if (foundById) {
    return foundById
  }

  const foundByPath = this.files.get(normalize(runtime.relative(id)))

  if (foundByPath) {
    return foundByPath
  }
}
/**
  @param {Boolean} autoStart
*/
export function featureWasEnabled(options = {}) {
  this.hideGetter('fs', () => this.memoryFileSystem)

  this.hide('actions', actions)
  this.hide('computedProperties', computedProperties)

  this.hide('settings', {
    ...this.runtime.argv,
    ...this.options,
    ...options,
  })

  actions.attach.call(this)
  computedProperties.attach.call(this)

  const { autoStart = !!this.settings.startFileManager } = this.settings

  if (autoStart) {
    this.startAsync()
  }
}

export async function syncMemoryFileSystem(options = {}) {
  const { fs = this.memoryFileSystem } = options
  const { runtime } = this
  const { fileObjects, directoryObjects } = this
  const { dirname } = this.runtime.pathUtils

  if (options.content) {
    const resp = await this.readAllContent({
      include: [/.*/],
      hash: true,
      ...options,
    })
  }

  const directoryPaths = this.chain
    .plant(directoryObjects)
    .uniqBy(d => d.path)
    .sortBy(d => d.path.length)

  directoryPaths.forEach(d => {
    if (!fs.existsSync(d.path)) {
      fs.mkdirpSync(d.path)
    }
  })

  fileObjects.forEach(f => {
    const fileDir = dirname(f.path)
    fs.mkdirpSync(fileDir)

    if (!fs.existsSync(f.path)) {
      const content = (f.content || '').toString()
      try {
        fs.writeFileSync(f.path, content && content.length ? content : '\n')
      } catch (error) {
        runtime.error('Error syncing file', { path: f.path, message: error.message })
      }
    }
  })

  return this.wrapMemoryFileSystem(options)
}

export const getPathMatcher = () => pathMatcher

export function getChains() {
  const fileManager = this

  return {
    patterns(...args) {
      const fileIds = fileManager.matchPatterns(...args)
      return fileManager.chain
        .plant(fileIds)
        .keyBy(v => v)
        .mapValues(v => fileManager.file(v))
    },

    route(route, options = {}) {
      return fileManager.chain.invoke('applyRouteMetadata', route, options)
    },

    get files() {
      return fileManager.chain.get('fileObjects')
    },
    get directories() {
      return fileManager.chain.get('directoryObjects')
    },
  }
}

export function applyRouteMetadata(route, options = {}) {
  const { meta: staticMeta = {} } = options
  const { mapValues } = this.lodash

  const results = this.chain
    .invoke('matchRoute', route, options)
    .keyBy('subject')
    .mapValues('result')
    .value()

  return mapValues(results, (metadata, fileId) => {
    if (options.directories) {
      const directory = this.directories.get(normalize(fileId))
      const { meta = {} } = directory

      this.directories.set(normalize(fileId), {
        ...directory,
        meta: {
          ...meta,
          ...staticMeta,
          ...metadata,
        },
      })

      return this.directories.get(normalize(fileId))
    } else {
      const file = this.files.get(normalize(fileId))
      const { meta = {} } = file

      this.files.set(normalize(fileId), {
        ...file,
        meta: {
          ...meta,
          ...staticMeta,
          ...metadata,
        },
      })

      return this.files.get(normalize(fileId))
    }
  })
}

export function matchRoute(route, options = {}) {
  const subjects = (options.directories ? this.directoryIds : this.fileIds).map(normalize)

  return applyRoute(route, subjects, {
    discard: true,
    ...options,
  })
}

export function matchPatterns(options = {}) {
  const { exclude = [], rules = options.rules || options.include || options || [] } = options

  const { castArray } = this.lodash
  const { makeRe } = this.runtime.feature('matcher')

  const excludePatterns = castArray(exclude).map(p => (typeof p === 'string' ? makeRe(p) : p))
  const includePatterns = castArray(rules).map(p => (typeof p === 'string' ? makeRe(p) : p))

  return this.matchPaths({
    ...options,
    rules: includePatterns,
    exclude: excludePatterns,
  })
}

export function matchPaths(options = {}) {
  const { castArray } = this.lodash
  let { exclude = [], rules = options.rules || options.include || options || [] } = options

  exclude = castArray(exclude)
  rules = castArray(rules)

  return options.fullPath
    ? this.fileObjects
        .filter(
          file =>
            (!rules.length || pathMatcher(rules, file.path)) &&
            (!exclude.length || !pathMatcher(exclude, file.path))
        )
        .map(result => result.relative)
    : this.fileIds.filter(
        fileId =>
          (!rules.length || pathMatcher(rules, normalize(fileId))) &&
          (!exclude.length || !pathMatcher(exclude, normalize(fileId)))
      )
}

export function selectMatches(options = {}) {
  const { convertToJS } = this.runtime
  const paths = this.matchPaths(options)
  return paths.map(key => convertToJS(this.files.get(normalize(key))))
}

/**
 * Calculate the md5 hash of the file by its id
 */
export function hashFile(key) {
  const fileManager = this

  return new Promise((resolve, reject) => {
    const result = file.call(fileManager, key)
    const path = result.path
    md5File(path, (err, hash) => (err ? reject(err) : resolve({ id: key, hash })))
  }).then(({ id, hash } = {}) => {
    updateFileHash.call(fileManager, id, hash)
    return hash
  })
}

/**
 * Calculate the md5 of all files matching a set of include and/or exclude rules.
 *
 * @param {Object} options
 * @param {Array|Function|String|Regexp} options.include - a rule, or array of rules that the path must match
 * @param {Array|Function|String|Regexp} options.exclude - a rule, or array of rules that the path must not match
 *
 */
export async function hashFiles(options = {}) {
  const { include = [], exclude = [] } = options

  const results = await Promise.all(
    this.files
      .values()
      .map(p => p.path)
      .filter(path => path && pathMatcher(include, path))
      .filter(path => path && (exclude.length === 0 || !pathMatcher(exclude, path)))
      .map(path => this.hashFile(normalize(this.runtime.relative(path))))
  )

  return results
}

export async function computeHash(options = {}) {
  const results = await this.hashFiles(options)
  return this.runtime.hashObject({ results })
}
/**
 * Returns the package manager manifests map, which is a map of parsed package.json
 * files found in the project
 */
export function getPackages() {
  return this.get('packageManager.manifests')
}

/**
 * Returns a reference to the runtime's package manager
 */
export function getPackageManager() {
  return this.runtime.feature('package-manager')
}

/**
 * Updates the md5 hash record for a particular file.
 *
 * @param {String} fileId - the id of the file
 * @param {String} hash - the hash of the file
 * @private
 */
export function updateFileHash(fileId, hash) {
  if (fileId && hash) {
    const result = file.call(this, fileId)

    if (result) {
      this.files.set(normalize(fileId), {
        ...result,
        hash,
      })
    }
  }

  return this
}

export function updateFileContent(fileId, content) {
  if (fileId && content) {
    const result = file.call(this, fileId)

    if (result) {
      this.files.set(normalize(fileId), {
        ...result,
        content,
      })
    }
  }

  return this
}

export async function readAllContent(options = {}) {
  const { include = [], exclude = [/secret/, /\.env/, /build\//] } = options

  const toFileId = path => normalize(this.runtime.relative(path))

  const fileManager = this

  const results = await Promise.all(
    this.chain
      .get('fileObjects')
      .map(p => p.path)
      .filter(path => pathMatcher(include, path))
      .filter(path => exclude.length === 0 || !pathMatcher(exclude, path))
      .thru(paths => {
        this.fireHook(WILL_READ_FILES, paths)
        return paths
      })
      .map(path =>
        this.runtime.fsx
          .readFileAsync(path)
          .then(buf => buf.toString())
          .then(content => [toFileId(path), content])
          .then(entry => {
            const [fileId, content] = entry
            fileManager.fireHook(
              RECEIVED_FILE_CONTENT,
              fileId,
              content,
              file.call(fileManager, fileId)
            )
            updateFileContent.call(fileManager, fileId, content)
            return options.hash ? hashFile.call(fileManager, fileId).then(() => entry) : entry
          })
      )
  )

  return options.object ? this.runtime.lodash.fromPairs(results) : results
}

export function getGit() {
  return this.runtime.feature('git')
}

export function getFiles() {
  return this.result('runtime.files', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getDirectories() {
  return this.result('runtime.directories', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getStatusMap() {
  return this.result('runtime.fileStatusMap', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getFilePaths() {
  return this.result('runtime.fileObjects', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  }).map(file => file.path)
}

export function getFileIds() {
  return this.result('runtime.fileIds', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getDirectoryIds() {
  return this.result('runtime.directoryIds', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getDirectoryObjects(options = {}) {
  return this.result('runtime.directoryObjects', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getFileObjects(options = {}) {
  return this.result('runtime.fileObjects', () => {
    throw new Error(`the file manager depends on the fs-adapter feature`)
  })
}

export function getModifiedFiles(options = {}) {
  const { markers = ['M', '??', 'D'] } = options

  return this.chain
    .get('statusMap', {})
    .omitBy(marker => markers.indexOf(marker) === -1)
    .keys()
    .value()
}

export function getModifiedDirectories(options = {}) {
  const { dirname } = this.runtime.pathUtils

  return this.chain
    .get('modifiedFiles')
    .map(path => dirname(path))
    .uniq()
    .value()
}

export function createMemoryFileSystem(options = {}) {
  return new Memory()
}

export function lazyMemoryFileSystem(options = {}) {
  return this.createMemoryFileSystem(options)
}

export function start(...args) {
  let cb, options

  if (typeof args[0] === 'function') {
    cb = args[0]
  } else if (typeof args[1] === 'function') {
    cb = args[1]
  }

  if (typeof args[0] === 'undefined' || typeof args[0] === 'object') {
    options = args[0] || {}
  }

  const promise = this.startAsync(options || {})

  if (typeof cb === 'function') {
    Promise.resolve(promise)
      .then(() => {
        cb && typeof cb.call === 'function' && cb.call(this, null, this)
      })
      .catch(e => {
        cb && typeof cb.call === 'function' && cb.call(this, e, this)
      })
  } else {
    return Promise.resolve(promise)
      .then(() => this)
      .catch(e => this)
  }
}

function startPackageManager() {
  return this.packageManager
    .startAsync()
    .then(() => {
      this.emit('packageManagerDidStart', this.packageManager)
    })
    .catch(error => {
      this.emit('packageManagerDidFail', error, this.packageManager)
    })
}

export async function startAsync(options = {}) {
  const {
    packages = this.get('settings.startPackageManager') || this.get('settings.packages'),
  } = options

  if (!this.has('git') || !this.get('git.files')) {
    const error = new Error(`FileManager depends on git`)
    this.error = error
    this.fireHook(DID_FAIL, error)
    this.status = FAILED
    // We can use something besides git; I have a normal walker / skywalker feature
    // which is just a lot slower than git ls-files; it should be updated to behave similarly
    throw error
  }

  try {
    const results = await startGitMode.call(this, options).catch(error => {
      this.fireHook(DID_FAIL, error)
      this.status = FAILED
      this.error = error
      throw error
    })

    if (packages || (options && options.startPackageManager)) {
      await startPackageManager.call(this)
    }

    return results
  } catch (error) {
    this.error = error
    this.emit(DID_FAIL, error)
    this.status = FAILED
    this.runtime.error(`File Manager Failed to start`, { message: error.message })
    if (this.options.abort || this.runtime.argv.abort) {
      throw error
    }
  }
}

export async function startGitMode(options = {}) {
  const { files: gitFiles, directories: gitDirectories, statusMap: gitStatusMap } = this.git

  if (this.status === STARTING) {
    await this.activationEventWasFired(options)
    return this
  } else if (this.status === READY) {
    if (!options.wait) {
      await this.git.run({ others: true, cached: true, ...options, clear: !!options.clear })
    }

    return this
  } else if (this.status === CREATED) {
    this.fireHook(WILL_START, options)
    this.status = STARTING

    try {
      await this.git.run({ others: true, cached: true, ...options, clear: !!options.clear })
    } catch (error) {
      this.error = error
      this.fireHook(DID_FAIL, error)
      this.status = FAILED
      return this
    }
  }

  try {
    const filesObserver = gitFiles.observe(update => {
      // this.runtime.debug("received file update", update.type, update.name)

      if (update.type === 'add') {
        this.fireHook(RECEIVED_FILE_ADD, update.name, update, this)
      } else if (update.type === 'remove') {
        this.fireHook(RECEIVED_FILE_REMOVE, update.name, update, this)
      } else if (update.type === 'update' || update.type === 'change') {
        this.fireHook(RECEIVED_FILE_UPDATE, update.name, update, this)
      } else {
        this.fireHook(RECEIVED_FILE_NOTIFICATION, update.type, update, this)
      }
    })

    const directoriesObserver = gitDirectories.observe(update => {
      this.fireHook(RECEIVED_DIRECTORY_UPDATE, update.type, update, this)
    })

    const statusObserver = gitStatusMap.observe(update => {
      this.fireHook(RECEIVED_STATUS_UPDATE, update.type, update, this)
    })

    this.hide('filesObserver', filesObserver, true)
    this.hide('statusObserver', statusObserver, true)
    this.hide('directoriesObserver', directoriesObserver, true)
  } catch (error) {
    this.fireHook(DID_FAIL, error)
    this.status = FAILED
    return this
  }

  this.status = READY

  this.fireHook(
    WAS_ACTIVATED,
    this.pick(
      'filesObserver',
      'statusObserver',
      'directoriesObserver',
      'files',
      'directories',
      'statusMap'
    )
  )

  return this
}
/**

*/
export function activationEventWasFired(options = {}) {
  const f = this
  const { timeout = 30 * 1000 } = options

  const ok = resolve => () => resolve(f)
  const notOk = (reject, err) => f => reject(err)

  if (this.status === FAILED || this.status === READY) {
    return Promise.resolve(this)
  }

  return new Promise((resolve, reject) => {
    f.once(WAS_ACTIVATED, () => ok(resolve)())
    f.once(DID_FAIL, err => notOk(reject, err)())
  })
    .timeout(timeout)
    .catch(error => f) // eslint-disable-line
    .then(() => f)
}

/**
  Returns a Promise which will resolve if, or when the file manager is activated
*/
export async function whenActivated(options = {}) {
  if (this.status === READY) {
    return this
  }

  if (this.status === CREATED) {
    this.status = STARTING
    await this.startAsync(options)
  } else if (this.status === STARTING) {
    await this.activationEventWasFired(options).catch(e => e)
  }

  return this
}

export function wrapMemoryFileSystem(options = {}) {
  const { promisify } = require('bluebird')
  const { memfs = this.memoryFileSystem } = options
  const { runtime } = this

  const memoryOnlyFunctions = {
    exists: memfs.exists.bind(memfs),
    mkdir: memfs.mkdir.bind(memfs),
    mkdirp: memfs.mkdirp.bind(memfs),
    readFile: memfs.readFile.bind(memfs),
    readdir: memfs.readdir.bind(memfs),
    readlink: memfs.readlink.bind(memfs),
    rmdir: memfs.rmdir.bind(memfs),
    stat: memfs.stat.bind(memfs),
    unlink: memfs.unlink.bind(memfs),
    writeFile: memfs.writeFile.bind(memfs),

    existsAsync: promisify(memfs.exists.bind(memfs)),
    mkdirAsync: promisify(memfs.mkdir.bind(memfs)),
    mkdirpAsync: promisify(memfs.mkdirp.bind(memfs)),
    readFileAsync: promisify(memfs.readFile.bind(memfs)),
    readdirAsync: promisify(memfs.readdir.bind(memfs)),
    readlinkAsync: promisify(memfs.readlink.bind(memfs)),
    rmdirAsync: promisify(memfs.rmdir.bind(memfs)),
    statAsync: promisify(memfs.stat.bind(memfs)),
    unlinkAsync: promisify(memfs.unlink.bind(memfs)),
    writeFileAsync: promisify(memfs.writeFile.bind(memfs)),

    existsSync: memfs.existsSync.bind(memfs),
    mkdirSync: memfs.mkdirSync.bind(memfs),
    mkdirpSync: memfs.mkdirpSync.bind(memfs),
    readFileSync: memfs.readFileSync.bind(memfs),
    readdirSync: memfs.readdirSync.bind(memfs),
    readlinkSync: memfs.readlinkSync.bind(memfs),
    rmdirSync: memfs.rmdirSync.bind(memfs),
    statSync: memfs.statSync.bind(memfs),

    unlinkSync: memfs.unlinkSync.bind(memfs),
    writeFileSync: memfs.writeFileSync.bind(memfs),

    writeJsonAsync(path, data) {
      return Promise.resolve(JSON.parse(memfs.writeFileSync(path, JSON.stringify(data)).toString()))
    },

    writeJsonSync(path, data) {
      return JSON.parse(memfs.writeFileSync(path, JSON.stringify(data)).toString())
    },

    writeJson(path, data, cb) {
      try {
        memfs.writeFileSync(path, JSON.stringify(data))
        cb()
      } catch (error) {
        cb(error)
      }
    },

    readJsonAsync(path) {
      return Promise.resolve(JSON.parse(memfs.readFileSync(path).toString()))
    },

    readJsonSync(path) {
      return JSON.parse(memfs.readFileSync(path).toString())
    },

    readJson(path, cb) {
      try {
        cb(JSON.parse(memfs.readFileSync(path).toString()))
      } catch (error) {
        cb(error)
      }
    },
  }

  if (options.fallback) {
    const readMethods = ['exists', 'readFile', 'readdir', 'readlink', 'stat']

    readMethods.forEach(methodName => {
      const sync = memoryOnlyFunctions[`${methodName}Sync`]
      const promise = memoryOnlyFunctions[`${methodName}Async`]
      const callback = memoryOnlyFunctions[methodName]

      // reads performed on the memory file system for files which don't yet exist
      memoryOnlyFunctions[`${methodName}Sync`] = function(...args) {
        if (!memfs.existsSync(args[0])) {
          return runtime.fsx[`${methodName}Async`](...args)
        }

        try {
          return sync(...args)
        } catch (error) {
          console.error(`Error in ${methodName}Sync`)
          const response = runtime.fsx[`${methodName}Sync`](...args)
          return response
        }
      }

      // reads performed on the memory file system for files which don't yet exist
      memoryOnlyFunctions[`${methodName}Async`] = async function(...args) {
        const exists = memfs.existsSync(args[0])

        if (!exists) {
          const value = await Promise.resolve(runtime.fsx[`${methodName}Async`](...args))
          return value
        }

        try {
          const response = await promise(...args)
          return response
        } catch (error) {
          const response = await runtime.fsx[`${methodName}Async`](...args)
          return response
        }
      }

      memoryOnlyFunctions[methodName] = function(...args) {
        if (!memfs.existsSync(args[0])) {
          runtime.fsx[methodName](...args)
          return
        }

        const cb = typeof args[args.length - 1] === 'function' ? args.pop() : undefined

        if (!cb) {
          throw new Error(`Must supply a callback argument`)
        }

        const hijacked = (err, ...response) => {
          if (err) {
            console.error(`Error in ${methodName}`)
            runtime.fsx[methodName](...args)
          } else {
            cb(null, ...response)
          }
        }

        const hijackedArgs = [...args.slice(0, args.length - 1), hijacked]

        callback(...hijackedArgs) // eslint-disable-line
      }
    })
  }

  const { alias = 'fsm' } = options

  this.runtime[alias] = memoryOnlyFunctions

  return Object.assign({}, memfs, memoryOnlyFunctions)
}

export const CREATED = 'CREATED'
export const STARTING = 'STARTING'
export const FAILED = 'FAILED'
export const READY = 'READY'

export const STATUSES = {
  CREATED,
  READY,
  FAILED,
  STARTING,
}

export const RECEIVED_FILE_CONTENT = 'willReceiveContent'
export const RECEIVED_FILE_UPDATE = 'didReceiveFileUpdate'
export const RECEIVED_FILE_ADD = 'didReceiveFile'
export const RECEIVED_FILE_REMOVE = 'didRemoveFile'
export const RECEIVED_FILE_NOTIFICATION = 'didReceiveNotification'

export const RECEIVED_DIRECTORY_UPDATE = 'didReceiveDirectoryUpdate'
export const RECEIVED_STATUS_UPDATE = 'didReceiveStatusUpdate'
export const WILL_READ_FILES = 'willReadFiles'
export const DID_FAIL = 'didFail'
export const WAS_ACTIVATED = 'wasActivated'
export const WILL_START = 'willStart'

export const LIFECYCLE_HOOKS = {
  RECEIVED_FILE_CONTENT,
  RECEIVED_FILE_ADD,
  RECEIVED_FILE_REMOVE,
  RECEIVED_FILE_UPDATE,
  RECEIVED_STATUS_UPDATE,
  RECEIVED_FILE_NOTIFICATION,
  RECEIVED_DIRECTORY_UPDATE,
  WILL_READ_FILES,
  DID_FAIL,
  WAS_ACTIVATED,
  WILL_START,
}

export const getStatuses = () => STATUSES

export const getLifeCycleHooks = () => LIFECYCLE_HOOKS

export function walkUp(options = {}) {
  const testPaths = this.findModulePaths({
    cwd: this.runtime.cwd,
    filename: 'package.json',
    ...options,
  })

  return options.sync
    ? this.runtime.fsx.existingSync(...testPaths)
    : Promise.resolve(this.runtime.fsx.existingAsync(...testPaths))
}

export function walkUpSync(options = {}) {
  const testPaths = this.findModulePaths({
    cwd: this.runtime.cwd,
    filename: 'package.json',
    ...options,
  })

  return this.runtime.fsx.existingSync(...testPaths)
}

export function findModulePaths(options = {}) {
  if (typeof options === 'string') {
    options = { cwd: options }
  }

  const cwd = options.cwd
  const filename = options.filename || options.file || options.filename || 'skypager.js'

  const parts = cwd.split('/').slice(1)

  parts[0] = `/${parts[0]}`

  const testPaths = []

  while (parts.length) {
    testPaths.push([...parts, filename].join('/'))
    parts.pop()
  }

  return testPaths
}

export async function hashBuildTree(options = {}) {
  const { runtime } = this
  const { exclude = [], baseFolder = runtime.resolve('lib') } = options

  const sourceHash = await this.hashTree()
  const buildFolderExists = await runtime.fsx.existsAsync(baseFolder)

  if (!buildFolderExists) {
    throw new Error(`Build folder does not exist: ${baseFolder}`)
  }

  const walker = runtime.skywalker.projectWalker({
    baseFolder,
    bare: true,
  })

  const tree = await new Promise((resolve, reject) => {
    walker.start((err, tree) => {
      err ? reject(err) : resolve(tree)
    })
  })

  let files = []

  function visit(node) {
    const { _: info } = node

    if (info.isDirectory) {
      info.children.map(node => visit(node))
    } else {
      files.push(info)
    }
  }

  visit(tree)

  const hashedFiles = await Promise.all(
    files
      .filter(file => !exclude.length || !pathMatcher(exclude, file.path))
      .map(
        file =>
          new Promise((resolve, reject) =>
            md5File(file.path, (err, hash) => (err ? reject(err) : resolve({ file, hash })))
          )
      )
  )

  const { sortBy } = this.lodash

  let outputFiles = hashedFiles.map(({ file, hash }) => ({
    size: file.size,
    createdAt: file.birthtime,
    updatedAt: file.mtime,
    name: this.runtime.pathUtils.relative(baseFolder, file.path),
    mimeType: file && file.mime && file.mime.mimeType,
    hash,
  }))

  const { max } = runtime.lodash
  const maxUpdatedAt = max(outputFiles, 'updatedAt')
  const count = outputFiles.length

  outputFiles = sortBy(outputFiles, 'name')

  const buildHash = runtime.hashObject(outputFiles.map(file => file.hash))

  return {
    buildHash,
    maxUpdatedAt,
    count,
    outputFiles,
    cacheKey: `${runtime.currentPackage.name}:${count}:${maxUpdatedAt}`,
    version: runtime.currentPackage.version,
    sourceHash,
    sha: runtime.gitInfo.sha,
  }
}
