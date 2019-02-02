import createSkywalker from 'skywalker'
import micromatch from 'micromatch'
import pathMatcher from '@skypager/runtime/lib/utils/path-matcher'
import { Feature } from '@skypager/runtime/lib/feature'

export default class SkywalkerFeature extends Feature {
  static isSkypagerHelper = true

  static shortcut = 'skywalker'

  shortcut = 'skywalker'

  get statusMap() {
    return this.runtime.filesStatusMap
  }

  get fileObjects() {
    return this.runtime.files.values()
  }

  get directoryObjects() {
    return this.runtime.directories.values()
  }

  get files() {
    return this.runtime.files
  }

  get directories() {
    return this.runtime.directories
  }

  get fileIds() {
    return this.runtime.fileIds
  }

  get directoryIds() {
    return this.runtime.directoryIds
  }

  create(options = {}) {
    if (typeof options === 'string') {
      options = { baseFolder: options }
    }

    return this.projectWalker({ bare: true, ...options })
  }

  createIgnorePatternMatchers(options = {}) {
    return this.readIgnoreFiles(options).map(p => micromatch.makeRe(p))
  }

  walker(options = {}) {
    return this.projectWalker(options)
  }

  projectWalker(options = {}) {
    const { runtime } = this
    const { addDirectory, addFile } = this.runtime

    if (typeof options === 'string') {
      options = { baseFolder: options }
    }

    let { baseFolder = runtime.get('argv.baseFolder', runtime.cwd) } = {
      ...this.options,
      ...options,
    }

    baseFolder = runtime.resolve(baseFolder)

    const { ignorePatterns = this.ignorePatterns } = options

    let skywalker = createSkywalker(baseFolder)

    if (options.bare) {
      return skywalker
    }

    skywalker = skywalker
      .ignoreDotFiles(options.ignoreDotFiles !== false)
      .directoryFilter(
        options.directoryFilter || /node_modules|tmp|\.git|dist|build|public/,
        (next, done) => {
          done(null, false)
          return false
        }
      )
      .fileFilter(/.log$/, (next, done) => {
        done(null, false)
        return false
      })

    if (options.includeMinified !== true) {
      skywalker = skywalker.fileFilter(/\.min\.js$/i, (next, done) => {
        done(null, false)
        return false
      })
    }

    options.ignorePatterns !== false &&
      ignorePatterns
        .filter(v => typeof v === 'string' && v.length)
        .forEach(pattern => {
          skywalker = skywalker
            .directoryFilter(pattern, (n, d) => d(null, false))
            .fileFilter(pattern, (n, d) => d(null, false))
        })

    const defaultVisit = node => {
      const { _: info } = node

      if (info.isDirectory) {
        addDirectory(info)
        return info.children.map(child => visit(child))
      } else {
        addFile(info)
        return node
      }
    }

    let visit
    if (typeof options.visit === 'function') {
      visit = options.visit
    } else if (typeof options.visit === 'boolean') {
      visit = options.visit ? defaultVisit : t => t
    } else {
      visit = defaultVisit
    }

    // eslint-disable-next-line
    skywalker.run = (err, tree) =>
      new Promise((resolve, reject) =>
        skywalker.start((err, tree) => {
          err ? reject(err) : resolve(tree)
        })
      ).then(tree => {
        try {
          visit(tree)
          return { tree, files: this.files.keys(), directories: this.directories.keys() }
        } catch (error) {
          return { tree, files: this.files.keys(), directories: this.directories.keys() }
        }
      })

    return skywalker
  }

  requireDocumentContext(rule, options = {}) {
    const requireFn = resolvedPath =>
      this.chain
        .get('fileObjects')
        .filter({ path: resolvedPath })
        .value()
    return this.requireContext(rule, { requireFn, ...options })
  }

  requireContext(rule, options = {}) {
    const { requireFn = require, keyBy = 'name', mapValues = 'path', formatId } = options

    return this.chain
      .invoke('selectMatches', { ...options, rules: rule })
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

  async walk(...args) {
    const i = this.walker(...args)
    await i.run()
    return this
  }

  watcher(options = {}) {
    try {
      require.resolve('gaze')
    } catch (error) {
      throw new Error(`Missing the gaze module, so file watching is unavailable.`)
    }

    const skywalker = this.projectWalker(options)
      .on('change', function(...args) {
        console.log('change', args)
      })
      .on('remove', function(...args) {
        console.log('remove', args)
      })
      .on('created', function(...args) {
        console.log('created', args)
      })
      .on('rename', function(...args) {
        console.log('rename', args)
      })

    return cb => {
      console.log('immediate callback')

      skywalker.run().then(() => {
        console.log('ran, running watcher')
        skywalker.watch('gaze', (...args) => {
          console.log('walker callback', args)
        })
        return this
      })
    }
  }

  get ignorePatterns() {
    return this.readIgnoreFiles().map(pattern => micromatch.makeRe(pattern))
  }

  readIgnoreFiles(options = {}) {
    if (typeof options === 'string') {
      options = { baseFolder: options }
    }

    const { runtime } = this
    const { compact, uniq } = runtime.lodash
    const {
      gitignore = true,
      skypagerignore = true,
      npmignore = false,
      dockerignore = false,
      baseFolder = runtime.cwd,
    } = { ...this.options, options }

    const files = compact([
      gitignore && runtime.fsx.findUpSync('.gitignore', { cwd: baseFolder }),
      npmignore && runtime.fsx.findUpSync('.npmignore', { cwd: baseFolder }),
      skypagerignore && runtime.fsx.findUpSync('.skypagerignore', { cwd: baseFolder }),
      dockerignore && runtime.fsx.findUpSync('.dockerignore', { cwd: baseFolder }),
    ])

    const contents = files.map(file => runtime.fsx.readFileSync(file).toString())

    const combinedPatterns = uniq([
      ...contents
        .reduce((memo, chunk) => (memo = memo.concat(chunk)), '')
        .split('\n')
        .map(t => t.trim())
        .filter(f => f && f.length > 1 && !f.startsWith('#')),
    ])

    return combinedPatterns.map(pattern => (pattern.endsWith('/') ? `${pattern}**` : pattern))
  }

  matchPaths(options = {}) {
    const { castArray } = this.lodash
    let { rules = options.rules || options || [] } = options

    rules = castArray(rules)

    if (options.glob) {
      rules = rules.map(rule => (typeof rule === 'string' ? micromatch.makeRe(rule) : rule))
    }

    const results = options.fullPath
      ? this.fileObjects
          .filter(file => pathMatcher(rules, file.path))
          .map(result => result.relative)
      : this.fileIds.filter(fileId => pathMatcher(rules, fileId))

    if (options.debug) {
      return { rules, options, results, fileObjectsCount: this.fileIds.length }
    }

    return results
  }

  selectMatches(options = {}) {
    const { convertToJS } = this.runtime
    const paths = this.matchPaths(options)

    if (options.debug) {
      return paths
    }

    return paths.map(key => convertToJS(this.file(key)))
  }

  file(fileIdOrPath) {
    return (
      this.files.get(fileIdOrPath) ||
      this.chain
        .get('fileObjects', [])
        .filter({ path: fileIdOrPath })
        .first()
        .value()
    )
  }

  directory(fileIdOrPath) {
    return (
      this.directories.get(fileIdOrPath) ||
      this.chain
        .get('directoryObjects', [])
        .filter({ path: fileIdOrPath })
        .first()
        .value()
    )
  }
}
