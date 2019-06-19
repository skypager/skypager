import Mdx from './mdx'

/**
 * @typedef {Object} FileWrapper
 * @property {String} content
 * @property {String} hash
 * @property {String} path
 * @property {String} relative
 * @property {String} dir
 * @property {String} relativeDirname
 * @property {Object} stats
 */

/**
 * @typedef {Object} Babel
 * @property {Object} ast
 * @property {Function} findNodes
 */

/**
 * @typedef {Object} VmRunner
 * @property {Function} run
 * @property {Array} results
 */

/**
 * @typedef {Object} ParsedMdx
 * @property {String} code
 * @property {Object} ast
 * @property {Object} meta
 * @property {Object} headingsMap
 * @property {Function} default
 */
export default class MdxNode extends Mdx {
  /**
   * Reference to the underlying file wrapper in skypager's file manager.
   * @memberof MdxNode#
   * @type {FileWrapper}
   */
  get file() {
    return this.tryGet('file', {
      path: `${this.name}.md`,
    })
  }

  /**
   * @type {String}
   * @memberof MdxNode#
   */
  get content() {
    return this.tryGet('content', this.tryGet('file.content'))
  }

  /**
   * Runs all of the code blocks.
   * @param {Object} options
   * @memberof MdxNode#
   */
  async run(options = {}) {
    await this.process(options)
    await this.toRunnable()

    const blocks =
      typeof options.filter === 'function' ? this.runners.filter(options.filter) : this.runners

    for (let block of blocks) {
      await block.runner.run()
    }
  }

  /**
   * Compiles each of the code blocks and exports an object of functions that can be used to run the code block.
   *
   * @param {Object} options
   * @memberof MdxNode#
   * @returns {Promise<Object<String,Function>>}
   */
  async toExport(options = {}) {
    const script = await this.toScriptHelper(options)

    const runner = await script.createVMRunner(options)

    const { vmContext } = runner

    options = {
      ...options,
    }

    await this.toRunnable({ ...options, vmContext })
    return this.toFunctions({ ...options, merge: true })
  }

  /**
   * Each codeblock can be turned into a script helper instance, giving us the ability to analyze the AST of a single block
   *
   * @type {Array<Babel>}
   * @memberof MdxNode#
   */
  get childScripts() {
    return this.chain
      .get('runners')
      .map(r => r.script)
      .keyBy(s => s.name)
      .value()
  }

  /**
   * Returns the VM Script Runner for each of the child scripts
   *
   * @type {Array<VmRunner>}
   * @memberof MdxNode#
   */
  get childRunners() {
    return this.chain
      .get('runners')
      .keyBy(r => r.script.name)
      .mapValues(r => r.runner)
      .value()
  }

  /**
   * Returns the results of each script that has been run.  Scripts will be keyed by their exportName,
   * which is derived from the parent heading the code block belongs to.
   *
   * @type {Object}
   * @memberof MdxNode#
   */
  get resultsByExportName() {
    const { stringUtils } = this.runtime
    const { camelCase, kebabCase } = stringUtils
    const { pick } = this.lodash

    const nameFn = ({ parentHeading, i }) => camelCase(kebabCase(parentHeading))

    return this.chain
      .get('runners')
      .groupBy(runner => nameFn(runner))
      .mapValues(runners =>
        runners
          .map(({ runner }) => runner.currentState.ran && pick(runner, 'results', 'errors'))
          .filter(Boolean)
      )
      .value()
  }

  /**
   * @param {Object} options
   * @param {Boolean} [options.merge=false] passing true will combine multiple blocks under the same heading into a single function
   * @param {Function} [options.nameFn] a function which will return the name of the function for a given codeblock
   * @returns {Object<String,Function>}
   * @memberof MdxNode#
   */
  toFunctions(options = {}) {
    const { stringUtils } = this.runtime
    const { camelCase, kebabCase } = stringUtils

    const nameFn =
      options.nameFn ||
      (({ parentHeading, i }) =>
        camelCase(kebabCase(parentHeading)) + (!options.merge && i ? i : ''))

    if (!options.merge) {
      const individualFunctions = this.chain.get('runners').keyBy(runner => nameFn(runner))

      return individualFunctions.mapValues(({ runner }) => (...args) => runner.run(...args)).value()
    }

    return this.chain
      .get('runners')
      .groupBy(runner => nameFn(runner))
      .mapValues((runners, fnName) => {
        // this function runs all the blocks
        async function runAllBlocksInSequence(...args) {
          for (let r of runners) {
            await r.runner.run(...args)
          }
        }

        runners.length > 1 &&
          runners.forEach(r => {
            runAllBlocksInSequence[`_block${r.i}`] = (...args) => r.runner.run(...args)
          })

        return { [fnName]: runAllBlocksInSequence }
      })
      .values()
      .reduce((memo, fn) => ({ ...memo, ...fn }), {})
      .value()
  }

  /**
   * Converts this document instance to a runnable document instance. Involves creating VMRunner objects for each code block.
   *
   * @memberof MdxNode#
   * @returns this
   */
  async toRunnable(options = {}) {
    const runners = await this.createVMRunners(options)
    this.state.set('runners', runners)
    return this
  }

  /**
   * Returns the VMRunners for each of this document's code blocks.
   *
   * @type {Array<VmRunner>}
   * @memberof MdxNode#
   */
  get runners() {
    if (this.currentState.runners) {
      return this.currentState.runners
    } else {
      this.state.set('runners', [])
    }

    return this.state.get('runners')
  }

  /**
   * Creates a Babel script helper instance for this document's JS content.
   * @memberof MdxNode#
   * @returns {Promise<Babel>}
   */
  async toScriptHelper(options = {}) {
    const { id = this.runtime.relative(this.file.path) } = options

    let { content = this.currentState.parsedContent, metadata = {} } = options

    if (!content || !content.length) {
      const { meta, code } = await this.parse(options)
      content = code

      metadata = Object.assign({}, meta, metadata)
    }

    return this.runtime.script(id, {
      ...options,
      meta: metadata,
      file: this.file,
      content,
    })
  }

  /**
   * Uses @skypager/helpers-mdx to convert the content of this markdown document to
   * a JavaScript module consisting of the React Component, AST, Headings Map, etc.
   *
   * Useful when all you have is the content markdown as a string.
   *
   * @param {Object} options
   * @memberof MdxNode#
   * @returns {Promise<ParsedMdx>}
   */
  async process(options = {}) {
    const scriptHelper = await this.toScriptHelper(options)
    const { ast, headingsMap, default: defaultExport, meta } = await scriptHelper
      .parse()
      .then(() => scriptHelper.sliceModule('ast', 'headingsMap', 'default', 'meta'))

    this.state.set('default', defaultExport)
    this.state.set('meta', {
      ...meta,
      ...scriptHelper.tryGet('meta', {}),
    })
    this.state.set('headingsMap', headingsMap)
    this.state.set('ast', ast)

    return {
      code: scriptHelper.content,
      ast,
      meta: this.currentState.meta,
      headingsMap,
      default: defaultExport,
    }
  }

  /**
   * Takes the raw markdown mdx content, parses it with @skypager/helpers-mdx, and then transpiles the resulting
   * code. Used by our process function internally.
   *
   * @private
   * @memberof MdxNode#
   * @returns {Promise<ParsedMdx>}
   */
  async transpile(options = {}) {
    const { code, meta, ast } = await require('@skypager/helpers-mdx')(this.content, {
      filePath: this.file.path,
      babel: true,
      ...options,
    })

    this.state.set('transpiledContent', code)

    return { code, ast, meta }
  }

  /**
   * Takes the raw markdown mdx content, and parses it with mdx, returning jsx code
   */
  async parse(options = {}) {
    if (!this.file.path) {
      throw new Error(`Missing underlying file component with a path.`)
    }

    const { code, ast, meta } = await require('@skypager/helpers-mdx')(this.content, {
      filePath: this.file.path,
      ...options,
      rehypePlugins: [
        () => tree => {
          this.state.set('rehypeAst', tree)
          return tree
        },
      ],
      babel: false,
    })

    this.state.set('parsed', true)
    this.state.set('parsedContent', code)

    return { ast, code, meta }
  }

  /**
   * Returns the line numbers of each heading found in the document.
   *
   * @type {Object<String,Number>}
   * @memberof MdxNode#
   */
  get headingLineNumbers() {
    return this.chain
      .get('headingsMap.lines')
      .invert()
      .mapValues(v => parseInt(v, 10))
      .entries()
      .sortBy(v => v[1])
      .fromPairs()
      .value()
  }

  /**
   * Creates VmRunners for each of the code blocks.
   * @private
   * @memberof MdxNode#
   * @param {Object} options
   */
  async createVMRunners(options = {}) {
    const { runtime } = this
    const { castArray } = this.lodash
    const { codeBlocks } = this

    const script = await this.toScriptHelper(options)
    const prefix = script.name

    await script.parse()

    const scriptRunner = await script.createVMRunner(options)
    const { vmContext } = scriptRunner

    const requireScripts = castArray(options.require).filter(Boolean)

    if (requireScripts.length) {
      const code = await Promise.all(
        requireScripts.map(p => {
          let modPath = runtime.resolve(p)

          if (!runtime.fsx.existsSync(modPath)) {
            modPath = runtime.packageFinder.attemptResolve(modPath)
            modPath = modPath || require.resolve(p)

            if (!modPath) {
              throw new Error(`Could not require setup script: ${p}`)
            }
          }

          return runtime.fsx.readFileAsync(modPath).then(buf => buf.toString())
        })
      )

      Object.defineProperty(vmContext, 'global', {
        get: () => vmContext,
      })

      code.forEach(content => {
        const s = runtime.createScript(content)
        s.runInContext(vmContext)
      })
    }

    this.hide('scriptRunner', scriptRunner)
    this.hide('vmContext', vmContext)

    return Promise.all(
      codeBlocks
        .filter(b => b.lang && b.lang === 'javascript')
        .map((node, i) => {
          const { value, position } = node

          const parent = this.findParentHeading(node)
          const parentHeading = this.findParentHeading(node, { stringify: true })
          const script = this.runtime.script(`${prefix}/${i}`, {
            content: value,
            meta: { position, parent },
          })

          const startLine = script.tryGet('meta.position.start.line', 0)

          return script
            .parse()
            .then(() =>
              script.createVMRunner({
                ...options,
                vmContext,
              })
            )
            .then(runner => ({
              i,
              index: i,
              script,
              position,
              startLine,
              runner,
              run: (...args) => runner.run(...args),
              parentHeading,
              depth: parent.depth,
            }))
        })
    )
  }

  static attach(runtime, options) {
    Mdx.attach(runtime, {
      baseClass: MdxNode,
      ...options,
    })
  }
}
