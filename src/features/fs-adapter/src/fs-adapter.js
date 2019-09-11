import fsx from 'fs-extra-promise'
import findUp from 'find-up'

const statsKeys = [
  'dev',
  'mode',
  'nlink',
  'uid',
  'gid',
  'rdev',
  'blksize',
  'ino',
  'size',
  'blocks',
  'atimeMs',
  'mtimeMs',
  'ctimeMs',
  'birthtimeMs',
  'atime',
  'mtime',
  'ctime',
  'birthtime',
]

export const hostMethods = [
  'lazyFsx',
  'lazyFs',
  'join',
  'resolve',
  'relative',
  'getDirname',
  'lazyCurrentPackage',
  'lazyManifestPath',
  'lazyParentManifestPath',
  'lazyParentPackage',
  'lazyParentPackagePath',
  'file',
  'directory',
]

export function file(fileIdOrPath) {
  return (
    this.files.get(fileIdOrPath) ||
    this.chain
      .get('fileObjects', [])
      .filter({ path: fileIdOrPath })
      .first()
      .value()
  )
}

export function directory(fileIdOrPath) {
  return (
    this.directories.get(fileIdOrPath) ||
    this.chain
      .get('directoryObjects', [])
      .filter({ path: fileIdOrPath })
      .first()
      .value()
  )
}
export function featureWasEnabled() {
  const { runtime } = this

  try {
    runtime.makeObservable(
      {
        files: ['shallowMap', {}],
        directories: ['shallowMap', {}],
        fileStatusMap: ['shallowMap', {}],

        fileObjects: [
          'computed',
          function() {
            return this.files.values()
          },
        ],

        directoryObjects: [
          'computed',
          function() {
            return this.directories.values()
          },
        ],

        fileIds: [
          'computed',
          function() {
            return this.files.keys()
          },
        ],

        directoryIds: [
          'computed',
          function() {
            return this.directories.keys()
          },
        ],

        addDirectory: [
          'action',
          function(fileInfo, baseFolder) {
            const runtime = this
            const { directories } = this
            const { pick } = runtime.lodash
            const { parse, relative } = runtime.pathUtils
            const toFileId = ({ path }) =>
              relative(runtime.resolve(baseFolder || runtime.cwd), path)

            directories.set(toFileId(fileInfo), {
              ...parse(fileInfo.path),
              ...pick(fileInfo, 'path', 'mime'),
              isDirectory: true,
              type: 'directory',
              relative: toFileId(fileInfo),
              stats: pick(fileInfo, statsKeys),
            })

            return this
          },
        ],

        addFile: [
          'action',
          function(fileInfo, baseFolder) {
            const runtime = this
            const { files } = this
            const { pick } = runtime.lodash
            const { parse, relative, dirname } = runtime.pathUtils
            const toFileId = ({ path }) =>
              relative(runtime.resolve(baseFolder || runtime.cwd), path)

            files.set(toFileId(fileInfo), {
              ...parse(fileInfo.path),
              ...pick(fileInfo, 'path', 'mime'),
              isDirectory: false,
              type: 'file',
              isIndex: !!fileInfo.name.match(/index/i),
              extension: `.${fileInfo.extension}`,
              relative: toFileId(fileInfo),
              relativeDirname: dirname(toFileId(fileInfo)),
              stats: pick(fileInfo, statsKeys),
            })

            return this
          },
        ],
      },
      runtime
    )
  } catch (error) {
    console.log('ERROR', error)
    this.errorState = error
  }
}

export function lazyManifestPath() {
  return this.tryResult('manifestPath', () => findUp.sync('package.json', { cwd: this.cwd }))
}

export function lazyParentManifestPath() {
  return (
    this.tryResult('manifestPath', () => findUp.sync('package.json', { cwd: this.join('..') })) ||
    this.manifestPath
  )
}

export function lazyParentPackagePath() {
  if (this.parentManifestPath) {
    return this.pathUtils.dirname(this.parentManifestPath)
  } else {
    return this.cwd
  }
}

export function getDirname() {
  return require('path').basename(this.cwd)
}

export function lazyCurrentPackage() {
  if (!this.manifestPath) {
    return {}
  }

  try {
    return this.tryResult('pkg', () => this.fsx.readJsonSync(this.manifestPath))
  } catch (error) {
    return {}
  }
}

export function lazyParentPackage() {
  return this.tryResult('parentPkg', () => this.fsx.readJsonSync(this.parentManifestPath))
}

export function join(...args) {
  const { join } = this.pathUtils
  return join(this.cwd, ...args.filter(f => typeof f === 'string'))
}

export function resolve(...args) {
  const { resolve } = this.pathUtils
  return resolve(this.cwd, ...args.filter(f => typeof f === 'string'))
}

export function relative(...args) {
  const { relative } = this.pathUtils
  return relative(this.cwd, this.resolve(...args))
}

export function lazyFs() {
  return this.fsx
}

export function lazyFsx() {
  const { pick } = this.lodash

  const methods = [
    'outputJson',
    'writeFile',
    'readFile',
    'readdir',
    'readJson',
    'writeJson',
    'outputFile',
    'exists',
    'mkdirp',
    'copy',
    'move',
    'mkdtemp',
    'remove',
    'ensure',
    'ensureDir',
    'ensureFile',
    'ensureLink',
    'ensureSymlink',
    'isDirectory',
    'emptyDir',
    'rmdir',
    'unlink',
    'stat',
  ]

  methods.push(...methods.map(name => `${name}Sync`))
  methods.push(...methods.map(name => `${name}Async`))

  const selected = pick(fsx, methods)

  selected.findUpAsync = findUp
  selected.findUp = findUp
  selected.findUpSync = findUp.sync
  selected.existingSync = (...paths) => paths.filter(fsx.existsSync)
  selected.existingAsync = selected.existing = (...paths) =>
    Promise.all(paths.map(p => fsx.existsAsync(p).then(r => r && p))).then(results =>
      results.filter(p => p)
    )

  const mime = require('mime')
  const mimeTypes = mime.types || mime._types

  selected.mimeTypes = () => mimeTypes
  selected.mimeType = ext => mimeTypes[ext.replace('.', '')]

  return selected
}
