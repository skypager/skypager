import zlib from 'zlib'
import pathMatcher from '@skypager/runtime/lib/utils/path-matcher'
import createSkywalker from 'skywalker'

export const createGetter = 'git'

export const featureMethods = [
  'findRepo',
  'getMeta',
  'getModifiedFiles',
  'getIsDirty',
  'lsFiles',
  'walker',
  'watcher',
  'walk',
  'exists',
  'filesStatus',
  'toFileId',
  'updateStatus',
  'toJSON',
  'run',
  'clearState',
  'poll',
  'stopPolling',
  'getFiles',
  'getStatusMap',
  'getFileIds',
  'getDirectories',
  'getDirectoryIds',
  'getDirectoryObjects',
  'getFileObjects',
  'clone',
  'init',
]

export const hostMethods = ['getGitInfo']

const pollers = new WeakMap()

export function stopPolling() {
  if (pollers.has(this)) {
    clearInterval(pollers.get(this.runtime))
    pollers.delete(this)
  }

  return this
}

export function clone(options = {}, dest) {
  if (typeof options === 'string') {
    options = { repo: options }
  }

  if (typeof dest === 'string') {
    options.folder = dest
  }

  const { spawn } = this.runtime.proc.async
  const { repo, folder } = options

  return spawn('git', ['clone', repo, folder], {
    stdio: 'ignore',
  })
}

export function init(folder) {
  const { spawn } = this.runtime.proc.async

  return spawn('git', ['init', '.'], {
    cwd: this.runtime.resolve(folder),
    stdio: 'ignore',
  })
}

export async function poll(options = {}) {
  const { runtime } = this
  if (options === false) {
    return this.stopPolling()
  }

  const { interval = 40 * 1000 } = options

  if (!pollers.has(runtime)) {
    pollers.set(
      runtime,
      setInterval(() => {
        runtime.debug('git is polling')

        this.run()
          .then(() => {
            runtime.debug('git finished polling')
          })
          .catch(error => {})
      }, interval)
    )
  } else {
    this.stopPolling().poll(options)
  }

  await this.run(options)

  return this
}

export function clearState(options = {}) {
  options.files !== false && this.files.clear()
  options.directories !== false && this.directories.clear()
  options.statusMap !== false && this.statusMap.clear()

  return this
}

export function toFileId(p) {
  return this.runtime.relative(p.path ? p.path : p)
}

export async function run(options = {}) {
  if (options.clear) {
    this.clearState(options)
  }

  await this.walk(options)
  await this.updateStatus(options)

  return this
}

export function toJSON() {
  return this.runtime.convertToJS({
    files: this.files.toJS(),
    directories: this.directories.toJS(),
    statusMap: this.statusMap.toJS(),
    ...this.runtime.gitInfo,
  })
}

export function getStatusMap() {
  return this.runtime.fileStatusMap
}

export function getFiles() {
  return this.runtime.files
}

export function getDirectories() {
  return this.runtime.directories
}

export function getFileIds() {
  return this.runtime.fileIds
}

export function getDirectoryIds() {
  return this.runtime.directoryIds
}

export function exists(path) {
  const fileId = this.runtime.relative(path)
  return this.files.has(fileId) || this.directories.has(fileId)
}

export async function walker(options = {}) {
  const { exclude = [], include = [] } = options

  await this.walk(options)

  const rel = path => this.runtime.relative(path)

  function onlyGitFiles(next, done) {
    const fileId = rel(this._.path)

    if (!this.exists(fileId)) {
      done(null, false)
      return
    }

    if (include.length && !pathMatcher(include, this._.path)) {
      done(null, false)
      return
    }

    if (pathMatcher(exclude, this._.path)) {
      done(null, false)
    } else {
      next()
    }
  }

  const i = this

  return createSkywalker(this.runtime.cwd)
    .ignoreDotFiles(true)
    .fileFilter(/.*/, onlyGitFiles.bind(this))
    .directoryFilter(/.*/, onlyGitFiles.bind(this))
    .on('file', function(file) {
      i.emit('receivedFile', rel(file._.path), file)
    })
    .on('directory', function(file) {
      i.emit('receivedDirectory', rel(file._.path), file)
    })
}

export async function updateStatus(options = {}) {
  const fileStatus = await this.filesStatus({ object: true })

  this.runtime.lodash.mapValues(fileStatus, (status, fileId) => {
    this.statusMap.set(fileId, status)
  })

  return this
}

export async function walk(options = {}) {
  const { runtime } = this
  const { dirname, parse } = runtime.pathUtils
  const { pick } = runtime.lodash

  const { files, directories } = this

  const normalize = path => path.replace(/\\\\?/g, '/')
  const statFile = async path => {
    const exists = await runtime.fsx.existsAsync(path)

    if (!exists) {
      return this
    }

    const stats = await runtime.fsx.statAsync(path)

    const dir = dirname(path)
    const relativeDirname = normalize(runtime.relative(dir))
    const relativeFile = normalize(runtime.relative(path))
    const isDirectory = stats.isDirectory()
    const parsed = parse(path)

    if (!isDirectory && !directories.has(relativeDirname)) {
      try {
        const result = await runtime.fsx.statAsync(dir)
        directories.set(relativeDirname, {
          ...parsed,
          path: dir,
          relativeDirname: dirname(relativeDirname),
          relative: relativeDirname,
          stats: result,
        })
        runtime.emit('gitDidReceiveDirectory', relativeDirname, directories.get(relativeDirname))
      } catch (error) {}
    } else if (isDirectory && !directories.has(relativeFile)) {
      try {
        const result = await runtime.fsx.statAsync(path)
        directories.set(relativeFile, { ...parsed, path, relative: relativeFile, stats: result })
        runtime.emit('gitDidReceiveDirectory', relativeFile, directories.get(relativeFile))
      } catch (error) {}
    }

    if (!isDirectory && !files.has(relativeFile)) {
      files.set(relativeFile, {
        ...parsed,
        path,
        relativeDirname: dirname(relativeFile),
        relative: relativeFile,
        stats,
        extension: parsed.ext,
        mime: { mimeType: this.runtime.fsx.mimeType(parsed.ext) },
      })
      runtime.emit('gitDidReceiveFile', relativeFile, files.get(relativeFile))
    }

    return this
  }

  let filePaths = await this.lsFiles({
    others: false,
    gitignore: true,
    ...pick(
      options,
      'others',
      'gitignore',
      'cached',
      'skypagerignore',
      'pattern',
      'exclude',
      'cwd',
      'fullName',
      'flags'
    ),
  })

  await Promise.all(
    runtime.lodash
      .uniq(filePaths)
      .filter(p => p.length)
      .map(p => statFile(runtime.resolve(p)))
  )

  return this
}

export async function filesStatus(options = {}) {
  return this.runtime
    .select('process/output', {
      cwd: this.runtime.cwd,
      env: this.runtime.environment,
      command: 'git status --porcelain',
      format: 'lines',
      outputOnly: false,
    })
    .then(({ stdout = '', stderr = '' } = {}) =>
      stdout.map(l =>
        l
          .trim()
          .split(' ')
          .reverse()
      )
    )
    .catch(e => [])
    .then(p => (options.object ? this.runtime.lodash.fromPairs(p) : p))
}

export async function lsFiles(options = {}) {
  if (typeof options === 'string') {
    options = { pattern: options }
  }

  const {
    env = this.runtime.environment,
    cwd = this.runtime.cwd,
    fullName = false,
    exclude = [],
    status = false,
    flags = '',
    gitignore = true,
    skypagerignore = false,
    others = true,
    debug = false,
    cached = true,
  } = options

  let pattern = options.pattern || null
  let excludeArgs = this.runtime.lodash.castArray(exclude).map(p => `--exclude ${p}`)

  const command = [
    `git ls-files`,
    pattern,
    fullName ? '--full-name' : null,
    debug ? '--debug' : null,
    status ? '-t' : null,
    gitignore ? '--exclude-from .gitignore' : null,
    skypagerignore ? '--exclude-from .skypagerignore' : null,
    others && !debug ? '--others' : null,
    // only need to include cached if others is set to true otherwise others only returns untracked
    others && cached ? '--cached' : null,
    flags,
    ...excludeArgs,
  ]
    .filter(v => v && v.length > 0)
    .join(' ')

  return this.runtime
    .select('process/output', { command, cwd, env, format: 'lines', outputOnly: true })
    .catch(error => '')
}

export function getGitInfo() {
  return this.feature('git').meta
}

export function findRepo() {
  const { runtime } = this
  return runtime.fsx.findUpSync('.git')
}

export function getIsDirty() {
  return this.modifiedFiles.length > 0
}

export function getModifiedFiles() {
  return this.statusMap.keys()
}

export function getMeta() {
  const { runtime } = this
  const path = runtime.pathUtils
  const fs = runtime.fs
  const gitPath = this.findRepo()

  const result = {
    sha: null,
    abbreviatedSha: null,
    branch: null,
    tag: null,
    root: path.resolve(gitPath, '..'),
  }

  function findPackedTag(sha) {
    const packedRefsFilePath = path.join(gitPath, 'packed-refs')
    if (fs.existsSync(packedRefsFilePath)) {
      const packedRefsFile = fs.readFileSync(packedRefsFilePath, { encoding: 'utf8' })
      const tagLine = packedRefsFile.split('\n').filter(function(line) {
        return line.indexOf('refs/tags') > -1 && line.indexOf(sha) > -1
      })[0]

      if (tagLine) {
        return tagLine.split('tags/')[1]
      }
    }
  }

  function commitForTag(tag) {
    const tagPath = path.join(gitPath, 'refs', 'tags', tag)
    const taggedObject = fs.readFileSync(tagPath, { encoding: 'utf8' }).trim()
    const objectPath = path.join(
      gitPath,
      'objects',
      taggedObject.slice(0, 2),
      taggedObject.slice(2)
    )

    if (!zlib.inflateSync || !fs.existsSync(objectPath)) {
      // we cannot support annotated tags on node v0.10 because
      // zlib does not allow sync access
      return taggedObject
    }

    const objectContents = zlib.inflateSync(fs.readFileSync(objectPath)).toString()

    // 'tag 172\u0000object c1ee41c325d54f410b133e0018c7a6b1316f6cda\ntype commit\ntag awesome-tag\ntagger Robert Jackson <robert.w.jackson@me.com> 1429100021 -0400\n\nI am making an annotated tag.\n'
    if (objectContents.slice(0, 3) === 'tag') {
      const sections = objectContents.split(/\0|\n/)
      const sha = sections[1].slice(7)

      return sha
    } else {
      // this will return the tag for lightweight tags
      return taggedObject
    }
  }

  function findTag(sha) {
    let tag = findPackedTag(sha)
    if (tag) {
      return tag
    }

    const tagsPath = path.join(gitPath, 'refs', 'tags')
    if (!fs.existsSync(tagsPath)) {
      return false
    }

    const tags = fs.readdirSync(tagsPath)

    for (let i = 0, l = tags.length; i < l; i++) {
      tag = tags[i]
      const commitAtTag = commitForTag(tags[i])

      if (commitAtTag === sha) {
        return tag
      }
    }
  }

  try {
    const headFilePath = path.join(gitPath, 'HEAD')

    if (fs.existsSync(headFilePath)) {
      const headFile = fs.readFileSync(headFilePath, { encoding: 'utf8' })
      let branchName = headFile
        .split('/')
        .slice(2)
        .join('/')
        .trim()
      if (!branchName) {
        branchName = headFile
          .split('/')
          .slice(-1)[0]
          .trim()
      }
      const refPath = headFile.split(' ')[1]

      // Find branch and SHA
      if (refPath) {
        const branchPath = path.join(gitPath, refPath.trim())

        result.branch = branchName
        result.sha = fs.readFileSync(branchPath, { encoding: 'utf8' }).trim()
      } else {
        result.sha = branchName
      }

      result.abbreviatedSha = result.sha.slice(0, 10)

      // Find tag
      let tag = findTag(result.sha)
      if (tag) {
        result.tag = tag
      }
    }
  } catch (e) {
    if (!module.exports._suppressErrors) {
      throw e // helps with testing and scenarios where we do not expect errors
    } else {
      // eat the error
    }
  }

  return result
}
