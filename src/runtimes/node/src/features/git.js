import zlib from 'zlib'
import pathMatcher from '@skypager/runtime/lib/utils/path-matcher'
import createSkywalker from 'skywalker'
import { Feature } from '@skypager/runtime/lib/feature'

// For very large git repos, node's default max buffer for exec is too small
// and i don't know how to use async spawn well enough to capture all the output and resolve etc
const MAX_OUTPUT_BUFFER = process.env.SKYPAGER_GIT_MAX_OUTPUT_BUFFER || 1024 * 1024

const pollers = new WeakMap()

export const hostMethods = ['getGitInfo']

/**
 * @class GitFeature
 * @classdesc The Git Feature provides an interface for real time status about the git tree,
 * including all of the files and their current status, as well as information about the current branch,
 * sha, tag, etc.
 */
export default class GitFeature extends Feature {
  static shortcut = 'git'

  shortcut = 'git'

  hostMethods = hostMethods

  static hostMethods = ['getGitInfo']

  /**
   * @memberof Runtime
   * @property gitInfo
   * @type {{ branch: string, sha: string, abbreviatedSha: string, tag: string, root: string }}
   */
  static getGitInfo() {
    return this.feature('git').meta
  }

  /**
   * Returns a map of the files and their git status
   * @memberof GitFeature
   * @type {Map}
   */
  get statusMap() {
    return this.runtime.fileStatusMap
  }

  /**
   * Returns a map of files
   * @memberof GitFeature
   * @type {Map}
   */
  get files() {
    return this.runtime.files
  }

  /**
   * Returns a map of directories
   * @memberof GitFeature
   * @type {Map}
   */
  get directories() {
    return this.runtime.directories
  }

  /**
   * Returns an array of file ids from the files map
   * @memberof GitFeature
   * @type {Array<String>}
   */
  get fileIds() {
    return this.runtime.fileIds
  }

  /**
   * Returns an array of directory ids from the directories map
   *
   * @memberof GitFeature
   * @type {Array<String>}
   */
  get directoryIds() {
    return this.runtime.directoryIds
  }

  /**
   * Returns true if there are any dirty files
   * @memberof GitFeature
   */
  get isDirty() {
    return this.modifiedFiles.length > 0
  }

  /**
   * Returns an array of files that have been modified
   *
   * @type {Array<String>}
   * @memberof GitFeature
   */
  get modifiedFiles() {
    return this.statusMap.keys()
  }

  findLatestTag() {
    const ref = this.runtime.proc
      .execSync(`git describe --always --long --dirty --first-parent`)
      .toString()

    const tag = ref.match(/(^.*)-\d-\w+(-dirty)?/)

    return tag && tag[1]
  }
  /**
   * Returns the files that have changed since the last commit sha.
   * @param {String} tagOrCommitSha tag or commit sha, pass true to use latest tag
   * @param {String} cwd subdirectory, defaults to .
   */
  modifiedSince(tagOrCommitSha, cwd) {
    if (!tagOrCommitSha || tagOrCommitSha === true) {
      const ref = this.runtime.proc
        .execSync(`git describe --always --long --dirty --first-parent`)
        .toString()

      const tag = ref.match(/(^.*)-\d-\w+(-dirty)?/)

      tagOrCommitSha = tag[1]
    }

    if (!tagOrCommitSha || !tagOrCommitSha.length) {
      throw new Error(`Invalid git SHA. Provide a tag or valid commit reference.`)
    }

    cwd = cwd || this.runtime.cwd

    const changedFiles = this.runtime.proc
      .execSync(`git diff --name-only ${tagOrCommitSha} -- ${cwd}`)
      .toString()
      .trim()

    return changedFiles.split('\n')
  }

  get meta() {
    const { runtime } = this

    // This allows us to simulate git metadata in docker
    if (process.env.SKYPAGER_GIT_INFO) {
      let envGitInfo

      try {
        envGitInfo = JSON.parse(process.env.SKYPAGER_GIT_INFO)
      } catch (error) {
        envGitInfo = {}
      }

      return {
        sha: process.env.SKYPAGER_GIT_INFO_SHA || envGitInfo.sha,
        branch: process.env.SKYPAGER_GIT_INFO_BRANCH || envGitInfo.branch,
        tag: process.env.SKYPAGER_GIT_INFO_TAG || envGitInfo.tag,
        abbreviatedSha: (process.env.SKYPAGER_GIT_INFO_SHA || envGitInfo.branch || '').slice(0, 10),
        root: process.env.SKYPAGER_GIT_INFO_ROOT || envGitInfo.root || runtime.cwd,
      }
    }

    const path = runtime.pathUtils
    const fs = runtime.fs
    const { isNull } = this.lodash
    let gitPath = this.findRepo()

    let noGit = false

    if (isNull(gitPath) || !gitPath) {
      noGit = true
    }

    const result = {
      sha: null,
      abbreviatedSha: null,
      branch: null,
      tag: null,
      root: noGit ? runtime.cwd : path.resolve(gitPath, '..'),
    }

    if (noGit) {
      return {
        ...result,
        sha: '',
        abbreviatedSha: '',
        branch: '',
        tag: '',
        root: runtime.cwd,
      }
    }

    function findPackedTag(sha) {
      const packedRefsFilePath = path.join(gitPath, 'packed-refs')
      if (fs.existsSync(packedRefsFilePath)) {
        const packedRefsFile = fs.readFileSync(packedRefsFilePath, {
          encoding: 'utf8',
        })
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
        const headFile = fs.readFileSync(headFilePath, {
          encoding: 'utf8',
        })
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
  stopPolling() {
    if (pollers.has(this)) {
      clearInterval(pollers.get(this.runtime))
      pollers.delete(this)
    }

    return this
  }

  /**
   * Clone a repository.
   *
   * @param {Object|String} options or repo path if a string
   * @param {String} options.repo the url of the repo you want to clone
   * @param {String} options.folder the folder you want to clone into
   * @param {Object|string} destination the destination path
   * @memberof GitFeature
   */
  clone(options = {}, dest) {
    if (typeof options === 'string') {
      options = { repo: options }
    }

    if (typeof dest === 'string') {
      options.folder = dest
    }

    const { spawn } = this.runtime.proc.async
    const { repo, folder } = options

    return spawn('git', ['clone', repo, folder], { stdio: 'ignore' })
  }

  init(folder) {
    const { spawn } = this.runtime.proc.async

    return spawn('git', ['init', '.'], {
      cwd: this.runtime.resolve(folder),
      stdio: 'ignore',
    })
  }

  async poll(options = {}) {
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

  clearState(options = {}) {
    options.files !== false && this.files.clear()
    options.directories !== false && this.directories.clear()
    options.statusMap !== false && this.statusMap.clear()

    return this
  }

  toFileId(p) {
    return this.runtime.relative(p.path ? p.path : p)
  }

  /**
   * Begin the stateful process of tracking the files with git
   *
   * @memberof GitFeature
   * @param {Object} options options which will be passed on to walk, and update status
   * @param {Boolean} [options.clear=false] clear the current state
   */
  async run(options = {}) {
    if (options.clear) {
      this.clearState(options)
    }

    await this.walk(options)
    await this.updateStatus(options)

    return this
  }

  /**
   * Dump the files directories and status objects to a JSON structure
   *
   * @return {{ files: object, directories: object, statusMap: objects, branch: string, tag: string, sha: string, root: string, abbreviatedSha: string }}
   * @memberof GitFeature
   */
  toJSON() {
    return this.runtime.convertToJS({
      files: this.files.toJS(),
      directories: this.directories.toJS(),
      statusMap: this.statusMap.toJS(),
      ...this.runtime.gitInfo,
    })
  }

  /**
   * Returns true if a file exists in the tree
   *
   * @param {String} path
   * @returns {Boolean}
   * @memberof GitFeature
   */
  exists(path) {
    const fileId = this.runtime.relative(path)
    return this.files.has(fileId) || this.directories.has(fileId)
  }

  /**
   * Creates a walker that will walk the files tree built by ls-files
   * and receive file and directory objects it finds, populating these
   * maps with information about the file stats, parsed path info, etc
   *
   * @returns {PromiseLike<Skywalker>}
   * @memberof GitFeature
   */
  async walker(options = {}) {
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

  /**
   * Updates the observable files map with status information from the git status map
   *
   * @memberof GitFeature
   */
  async updateStatus() {
    const fileStatus = await this.filesStatus({ object: true })

    this.runtime.lodash.mapValues(fileStatus, (status, fileId) => {
      this.statusMap.set(fileId, status)
    })

    return this
  }

  /**
   * Uses git ls-files to learn about all of the files in the tree,
   * populates the files and directories map with any information about the files it finds.
   *
   * @param {Object} options options for the walker behavior, same as lsFiles options
   * @memberof GitFeature
   */
  async walk(options = {}) {
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
          directories.set(relativeFile, {
            ...parsed,
            path,
            relative: relativeFile,
            stats: result,
          })
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

  /**
   * Returns the git status for any files that have been changed
   *
   * @returns {Object<string,Array<string>>}
   * @memberof GitFeature
   */
  async filesStatus(options = {}) {
    return this.runtime
      .select('process/output', {
        cwd: this.runtime.cwd,
        env: this.runtime.environment,
        maxBuffer: MAX_OUTPUT_BUFFER,
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

  /**
   * Run git ls-files to get a list of files in the tree
   *
   * @param {Object} options options for the ls-files command
   * @param {String} [options.cwd] the current working path to run the command in
   * @param {Boolean} [options.fullName=false]
   * @param {Boolean} [options.status=false] include the status in the output
   * @param {Boolean} [options.others=true] include other files
   * @param {Boolean} [options.cached=true] include cached files
   * @param {Number} [options.maxBuffer=1024*1024] the maxBuffer, for large git repos this needs to be bigger.  this comes from process.env.SKYPAGER_GIT_MAX_OUTPUT_BUFFER
   * @param {Boolean} [options.skypagerignore=false] include patterns found in the .skypagerignore file if it exists
   * @param {Array<String>} [options.exclude=[]] patterns to exclude
   * @memberof GitFeature
   */
  async lsFiles(options = {}) {
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
      maxBuffer = MAX_OUTPUT_BUFFER,
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
      others && !debug ? '--others' : null, // only need to include cached if others is set to true otherwise others only returns untracked
      others && cached ? '--cached' : null,
      flags,
      ...excludeArgs,
    ]
      .filter(v => v && v.length > 0)
      .join(' ')

    return this.runtime
      .select('process/output', {
        maxBuffer,
        command,
        cwd,
        env,
        format: 'lines',
        outputOnly: true,
      })
      .catch(e => {
        return ''
      })
  }

  /**
   * Find the nearest git repo by walking up the tree from cwd
   * @memberof GitFeature
   * @returns {String}
   */
  findRepo() {
    const { runtime } = this
    return runtime.fsx.findUpSync('.git')
  }
}
