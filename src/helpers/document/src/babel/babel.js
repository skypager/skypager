import { Helper } from '@skypager/runtime'
import { discover } from './discover'
import * as core from '@babel/core'
import traverse from '@babel/traverse'
import types from '@babel/types'

/**
 * @typedef {Object} Program
 * @property {Array} comments
 * @property {Array<ASTNode>} body
 *
 */
/**
 * @typedef {Object} BabelAST
 * @property {Program} program
 */

/**
 * @typedef {Object} Coordinates
 * @property {Number} line
 * @property {Number} column
 */

/**
 * @typedef {Object} ASTPath
 * @property {ASTNode} node
 * @property {Object} path
 */
/**
 * @typedef {Object} ASTNode
 * @property {SourcePosition} loc
 * @property {String} type
 * @property {Boolean} [static]
 * @property {String} [kind]
 */

/**
 * @typedef {Object} SourcePosition
 * @property {Coordinates} start
 * @property {Coordinates} end
 */

/**
 * @typedef {Object} SourceExtraction
 * @property {Function} toString
 * @property {SourcePosition} begin
 * @property {SourcePosition} end
 * @property {Array<String>} extractedLines
 * @property {Number} beginLine
 * @property {Number} endLine
 * @property {Number} beginColumn
 * @property {Number} endColumn
 */

/**
 * @typedef {Object} FileObject
 * @property {String} content
 * @property {String} hash
 * @property {String} path
 * @property {String} relative
 * @property {String} relativeDirname
 * @property {String} extname
 * @property {Object} stats
 *
 */

/**
 * @typedef {Object} UndocumentedReport
 * @property {String} name
 * @property {String} className
 * @property {String} type
 * @property {String} kind
 * @property {Boolean} static
 * @property {Number} lineNumber
 * @property {SourcePosition} loc
 */

/**
 * The Babel Helper lets us work with our JavaScript files and their AST
 *
 */
export class Babel extends Helper {
  // every call to runtime.page(pageId) will produce a new instance of a page
  static isCacheable = true

  // each instance of a page has observable state
  static isObservable = true

  get initialState() {
    return {
      content: this.tryGet('content'),
    }
  }

  static allowAnonymousProviders = true

  /**
   * @private
   */
  initialize() {
    /**
     * @property {Array<String>} lines
     *
     */
    this.lazy('lines', () => this.content.split('\n'))
  }

  /**
   * Uses this.content and creates a @babel AST using @babel/core's parse function
   * using the babel config
   *
   *
   * @param {Object} options
   * @param {Boolean} [options.refresh=false]
   * @param {Boolean} [options.fresh=false]
   * @param {String} [options.content=this.content]
   *
   */
  async parse(options = {}) {
    if (this.parsedAst && !options.refresh && !options.fresh) {
      return this.parsedAst
    }

    const parserFn = this.tryGet('parser', this.context.reg.parser || core.parse)
    const { content = this.content, cache = true } = options

    options = {
      ...this.provider,
      ...this.options,
      ...options,
    }

    const { omit } = this.lodash
    const babelOptions =
      typeof options.babel === 'object' ? options.babel : { presetEnv: { modules: 'auto' } }

    const babelConfig =
      options.babelConfig || this.context.reg.babelConfig || require('./babel-config')(babelOptions)

    const parsedAst = await new Promise((resolve, reject) => {
      parserFn(content, omit(babelConfig, 'ignore', 'env'), (err, result) => {
        err ? reject(err) : resolve(result)
      })
    }).catch(error => {
      error.babelConfig = babelConfig
      error.content = content
      throw error
    })

    if (cache !== false) {
      this.hide('parsedAst', parsedAst)
    }

    return parsedAst
  }

  /**
   * Given an ast and optional code snippet for a source map, produce parsedAst babel code
   *
   * @param {Object} options - the options
   * @param {Object} [options.babel] - options to be passed to the babel config generator (presetEnv)
   * @param {Object} [options.babelConfig] - supply your own babel config don't generate any
   * @param {Array} [options.body] - replace the body of our current ast program with a new body
   * @param {String} [options.code=this.content] - code to use for sourcemap generation
   * @param {Boolean} [options.parse=false] - create a new module from the generated code and return the module.exports
   *
   * @returns {Promise<Object>} returns a babel transform object, with code, ast, map properties
   *
   */
  async transformAst(options = {}) {
    const { runtime } = this
    const { body, code = this.content } = options
    let { ast = this.ast } = options

    const babelConfig = this.getBabelConfig(options)

    if (body) {
      ast = Object.assign({}, ast, {
        program: Object.assign({}, ast.program, { body }),
      })
    }

    let result

    try {
      result = code
        ? core.transformFromAst(ast, code, babelConfig)
        : core.transformFromAst(ast, '', babelConfig)
    } catch (error) {
      console.error('Error while transforming ast')
      console.error({ babelConfig })
      throw error
    }

    if (options.parse) {
      const newCode = result.code

      const requirePolyfill = identifier => {
        try {
          const resolved = runtime.packageFinder.attemptResolve(identifier)

          if (!resolved) {
            throw new Error(`Could not resolve ${identifier}`)
          }

          return runtime.currentModule.require(resolved)
        } catch (error) {
          console.error(
            `Error while requiring ${identifier} in the script helper virtual module: ${this.name}`
          )
          console.error(error)
        }
      }

      try {
        const newModule = this.runtime.createModule(`${newCode}`, {
          console,
          require: requirePolyfill,
        })
        return newModule.exports
      } catch (error) {
        console.error(`Error creating a new module`)
        console.error({ babelConfig })
        throw error
      }
    }

    return result
  }

  /**
   * Uses @babel/traverse to find nodes in the AST.  This can be combined with
   * findChildNodes to find nodes in the AST.
   *
   * @param {Object} options
   * @param {String} [options.type]
   * @param {Function} [options.filter]
   * @param {Object} [options.ast]
   * @returns {Array<ASTPath>}
   *
   */
  findNodes(options = {}) {
    const { isFunction } = this.lodash

    if (typeof options === 'string') {
      options = { type: options }
    }

    if (isFunction(options)) {
      options = { filter: options }
    }

    const { filter, type, ast = this.ast } = options

    const matches = []

    traverse(ast, {
      enter(path) {
        if (isFunction(filter)) {
          filter(path) && matches.push(path)
          return
        }

        if (typeof type === 'string' && path.node && path.node.type === type) {
          matches.push(path)
        }
      },
    })

    return matches
  }

  process(...args) {
    return this.parse(...args).then(() => this)
  }

  /**
   * Given two location objects { start: { line, column }, end: { line, column } }
   * or a single node with a loc.property that has start and end Position objects,
   * returns an object with a toString() method that will return the source for that node
   *
   * @param {SourcePosition} begin
   * @param {SourcePosition} end
   *
   * @returns {SourceExtraction}
   */
  extractSourceFromLocations(begin, end) {
    const { clone, isUndefined, get } = this.lodash

    if (begin && begin.loc && begin.loc.start && begin.loc.end && !end) {
      end = begin.loc
      begin = begin.loc
    }

    if (begin && begin.start && begin.end && !end) {
      end = begin.end
      begin = begin.start
    }

    const isValid = node =>
      !isUndefined(get(node, 'start.line')) && !isUndefined(get(node, 'end.line'))

    if (!isValid(begin) || !isValid(end)) {
      throw new Error(
        'Must pass two valid location objects. start.line start.column end.line end.column'
      )
    }

    const beginLine = begin.start.line
    const beginColumn = begin.start.column
    const endLine = end.end.line
    const endColumn = end.end.column

    let extractedLines = clone(this.lines.slice(beginLine - 1, endLine))

    if (extractedLines.length > 1) {
      extractedLines[0] = String(extractedLines[0]).slice(beginColumn)
      extractedLines[extractedLines.length - 1] = String(
        extractedLines[extractedLines.length - 1]
      ).slice(0, endColumn)
    } else {
      extractedLines[0] = String(extractedLines[0]).slice(beginColumn, endColumn)
    }

    return {
      begin,
      end,
      extractedLines,
      beginLine,
      endLine,
      beginColumn,
      endColumn,
      toString: () => extractedLines.join('\n'),
    }
  }

  /**
   * Given a node that you found with findNodes(), you can use the same API to search
   * within that node.  ObjectExpression is a node type you would search within to find
   * certain usage patterns
   *
   * @param {ASTNode} parentNode
   * @param {Object} options
   * @param {String} [options.type]
   * @param {Function} [options.filter]
   * @returns {Array<ASTNode>}
   *
   */
  findChildNodes(parentNode, options = {}) {
    const { isFunction } = this.lodash

    if (typeof options === 'string') {
      options = { type: options }
    }

    if (isFunction(options)) {
      options = { filter: options }
    }

    if (!parentNode || (parentNode && !isFunction(parentNode.traverse))) {
      throw new Error(
        `Did not pass a valid child node. Babel's ast nodes should have a traverse function on them`
      )
    }

    const { filter, type } = options
    const matches = []

    parentNode.traverse({
      enter(path) {
        if (isFunction(filter)) {
          filter(path) && matches.push(path)
          return
        }

        if (typeof type === 'string' && path.node && path.node.type === type) {
          matches.push(path)
        }
      },
    })

    return matches
  }

  /**
   * Find lines which match a pattern or set of patterns
   * Returns the lines that match along with their line number
   * @param {RegExp|Array<RegExp>} patterns
   * @param {Boolean} [includeInfo=true] include info about the match, and line number
   *
   * @returns {Array<String>}
   *
   */
  findLines(patterns, includeInfo = true) {
    const { castArray } = this.lodash
    const { lines = [] } = this
    const matches = []

    // pass an array of patterns to match any of them
    patterns = castArray(patterns)

    lines.forEach((line, index) => {
      const matchingPattern = patterns.find(pattern => line.match(pattern))

      if (matchingPattern) {
        matches.push([index + 1, line, matchingPattern])
      }
    })

    return includeInfo ? matches : matches.map(match => match[1])
  }

  /**
   * Creates a module from a list of top level export names.
   *
   * Note, currently the exports must be pure, and not rely on any scope in the module.
   *
   * @param {String} exportNames
   * @returns {Object}
   * @memberof Babel
   */
  async sliceModule(...exportNames) {
    const body = await this.findNodesByExportName(...exportNames)
    const newMod = await this.transformAst({
      body,
      parse: true,
    })

    return newMod
  }

  /**
   * Provides access to the @babel modules we rely on to traverse the AST
   *
   *
   */
  get babel() {
    return { core, types, traverse }
  }

  /**
   * Returns babel config for use with parse() and transform() methods
   * @returns {Object}
   * @param {Object} options
   * @param {Object} [options.babelConfig] specify babel config directly
   * @param {Object} [options.babel] options to be passed to the babel-config generator
   * @param {String} [options.modules] babel preset-env modules config
   *
   */
  getBabelConfig(options = {}) {
    const { omit, pick } = this.lodash

    options = { ...pick(this.options, 'babel', 'babelConfig'), ...options }

    const babelOptions =
      typeof options.babel === 'object'
        ? options.babel
        : { transformRuntime: true, presetEnv: { modules: options.modules || 'auto' } }

    const babelConfig = options.babelConfig || require('./babel-config')(babelOptions)

    return omit(babelConfig, 'env', 'ignore')
  }

  /**
   * Returns the ast that parse() generated.
   * @type {BabelAST}
   */
  get ast() {
    this.ensureState()
    return this.parsedAst
  }

  /**
   * Replaces the current AST with a new one
   *
   * @param {BabelAST} value
   */
  set ast(value) {
    /**
     *
     * @property {BabelAST} parsedAst
     */
    this.hide('parsedAst', value)
  }

  /**
   * Provides access to the comment nodes in the script
   * @type {Array<ASTNode>}
   *
   */
  get comments() {
    const { get } = this.lodash
    return get(this, 'ast.program.comments', [])
  }

  /**
   * The body section of the ast.program are the main nodes in the script
   * @type {Array<ASTNode>}
   *
   */
  get body() {
    const { get } = this.lodash
    return get(this, 'ast.program.body', [])
  }

  /**
   * @type {Array<String>}
   *
   */
  get bodyNodeTypes() {
    return this.body.map(node => node.type)
  }

  /**
   * The file content of the script.  May include wrapper content if the script helper instance or the scripts registry has a wrapContent function
   *
   */
  get content() {
    const wrapper = this.tryGet('wrapper', this.context.reg.wrapContent)
    return typeof wrapper === 'function'
      ? wrapper(this.unwrappedContent, this)
      : this.unwrappedContent
  }

  /**
   * The raw content that powers this script helper.  Could have been passed in as options on create,
   * registered as a provider, or be a part of a file discovered in the file manager.  Depending on how
   * the script helper instance was created.
   *
   * @type {String}
   *
   */
  get unwrappedContent() {
    return (
      this.currentState.content ||
      this.options.content ||
      this.provider.content ||
      this.get('file.content')
    )
  }

  /**
   * If there is an underlying file object in the file manager, for example,
   * this will refer to that.
   *
   * @type {FileObject}
   *
   */
  get file() {
    return this.currentState.file || this.options.file || this.provider.file
  }

  /**
   * Gives us all of the nodes of type ImportDeclaration
   * @type {Array<ASTNode>}
   *
   */
  get importDeclarations() {
    return this.body.filter(node => node.type === 'ImportDeclaration')
  }

  /**
   * Gives us all of the nodes that export something from the module
   * @type {Array<{ index: Number, node: ASTNode }>}
   *
   */
  get exportDeclarations() {
    return this.body
      .map((node, index) =>
        node.type === 'ExportDeclaration' ||
        node.type === 'ExportDefaultDeclaration' ||
        node.type === 'ExportNamedDeclaration'
          ? { node, index }
          : undefined
      )
      .filter(Boolean)
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get classDeclarations() {
    return this.findNodes({ type: 'ClassDeclaration' })
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get classInstanceMethods() {
    return this.findNodes({
      filter: ({ node }) => node.type === 'ClassMethod' && node.kind === 'method' && !node.static,
    })
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get classGetters() {
    return this.findNodes({
      filter: ({ node }) => node.type === 'ClassMethod' && node.kind === 'get' && !node.static,
    })
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get staticClassMethods() {
    return this.findNodes({
      filter: ({ node }) => node.type === 'ClassMethod' && node.kind === 'method' && node.static,
    })
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get staticClassGetters() {
    return this.findNodes({
      filter: ({ node }) => node.type === 'ClassMethod' && node.kind === 'get' && node.static,
    })
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get classProperties() {
    return this.findNodes({ filter: ({ node }) => node.type === 'ClassProperty' && !node.static })
  }

  /**
   *
   * @type {Array<ASTPath>}
   */
  get staticClassProperties() {
    return this.findNodes({
      filter: ({ node }) => node.type === 'ClassProperty' && node.static,
    })
  }

  /**
   * Returns the undocumented class members
   *
   *
   * @type {Array<UndocumentedReport>}
   */
  get undocumentedClassMembers() {
    const { isEmpty, omitBy, get } = this.lodash

    const types = ['ClassDeclaration', 'ClassMethod', 'ClassProperty']

    const undocumented = this.findNodes(
      ({ node }) => types.indexOf(node.type) > -1 && isEmpty(node.leadingComments)
    )

    const getNames = result =>
      result.node.type === 'ClassDeclaration'
        ? { name: get(result.node, 'id.name'), className: get(result.node, 'id.name') }
        : {
            name: get(result.node, 'key.name'),
            className: get(result.parentPath, 'container.id.name'),
          }

    return undocumented.map(result => {
      const { node } = result

      return {
        ...getNames(result),
        loc: node.loc,
        lineNumber: node.loc.start.line,
        type: node.type,
        kind: node.kind,
        static: node.static,
      }
    })
  }
  /**
   * Lists the modules the script imports using es6 import syntax
   *
   * @type {Array<String>}
   */
  get importsModules() {
    return this.importDeclarations
      .map(node => node && node.source && node.source.value)
      .filter(Boolean)
  }

  /**
   * Given the name of an export (e.g. pageSelectors, path) return the babel nodes that define them
   *
   * @returns {Array<ASTNode>}
   */
  findNodesByExportName(...exportNames) {
    const { sortBy } = this.lodash

    const nodeIndexes = sortBy(
      this.exportData.filter(node => exportNames.indexOf(node.name) !== -1),
      'index'
    ).map(node => node.index)

    return nodeIndexes.map(index => this.body[index])
  }

  /**
   *
   * @type {Array<String>}
   */
  get exportNames() {
    return this.exportData.map(exp => exp.name)
  }

  get defaultExportName() {
    return this.chain
      .get('exportData')
      .find(({ name }) => name === 'default')
      .get('exportName')
      .value()
  }

  /**
   * WIP. statically analyze what a module exports without running the code
   */
  get exportData() {
    const { isEmpty, isNull, uniq, flatten, get } = this.lodash
    const { exportDeclarations = [] } = this

    const names = exportDeclarations.map((item, i) => {
      const { node, index } = item
      switch (node.type) {
        case 'ExportDefaultDeclaration':
          return {
            name: 'default',
            index,
            exportName: get(node, 'declaration.id.name'),
            start: get(node, 'declaration.loc.start.line'),
            end: get(node, 'declaration.loc.end.line'),
          }
        case 'ExportNamedDeclaration':
          if (isNull(node.declaration) && !isEmpty(node.specifiers)) {
            return node.specifiers
              .filter(specifier => specifier.type === 'ExportSpecifier')
              .map(specifier => ({
                index,
                name: get(specifier, 'exported.name'),
                start: get(specifier, 'loc.start.line'),
                end: get(specifier, 'loc.end.line'),
              }))
          } else if (!isNull(node.declaration) && !isEmpty(node.declaration.declarations)) {
            const entry = {
              name: get(node, 'declaration.declarations[0].id.name'),
              start: get(node, 'loc.start.line'),
              end: get(node, 'loc.end.line'),
              index,
            }

            return entry
          } else if (!isNull(node.declaration) && node.declaration.type === 'FunctionDeclaration') {
            return {
              name: get(node, 'declaration.id.name'),
              start: get(node, 'declaration.loc.start.line'),
              end: get(node, 'declaration.loc.end.line'),
              index,
            }
          } else {
            return { index, node }
          }
        default:
          return undefined
      }
    })

    return flatten(names).filter(Boolean)
  }

  async createVMRunner(options = {}) {
    const { runtime } = this
    const { filename = runtime.resolve(`${this.name}.js`.replace('.js.js', '.js')) } = options

    const instructions = await this.createVMInstructions({
      transpile: true,
      ...options,
      filename,
    })

    return runtime.feature('vm-runner', {
      ...options,
      filename,
      ...instructions,
    })
  }

  async createVMInstructions(options = {}) {
    this.ensureState()

    const { runnableTypes = ['VariableDeclaration', 'ExpressionStatement'] } = options

    const script = this
    const { content } = this
    const { get, flatten, uniq } = this.lodash

    const decl = node =>
      node.type === 'ImportDeclaration'
        ? get(node, 'specifiers', [])
            .map(spec => get(spec, 'local.name'))
            .filter(v => v && v.length)
        : get(node, 'declarations', [])
            .map(dec => get(dec, 'id.name'))
            .concat([get(node, 'id.type') === 'Identifier' && get(node, 'id.name')])
            .filter(id => id && id.length)

    const isInspectable = ({ type }) => runnableTypes.indexOf(type) > -1

    const identifiers = uniq(flatten(this.body.map(decl))).filter(v => v && v.length)

    const accessors = importNode =>
      importNode.specifiers.map(spec =>
        spec.type === 'ImportDefaultSpecifier' ? ['default'] : [spec.local.name]
      )

    const instructions = {
      content,
      identifiers,
      parsed: this.body.map((node, i) => ({
        type: node.type,
        index: i,
        identifiers: decl(node),
        ...(node.type === 'ImportDeclaration' && { accessors: accessors(node) }),
        inspectable: isInspectable(node),
        statement: script.extractSourceFromLocations(node).toString(),
        position: node.loc,
        id: `${i}:${node.loc.start.line}:${node.loc.start.column}:${node.loc.end.line}:${
          node.loc.end.column
        }`,
      })),
    }

    if (options.transpile) {
      const babelConfig = this.getBabelConfig(options)

      await Promise.all(
        instructions.parsed.map(p =>
          core
            .transformAsync(p.statement, babelConfig)
            .then(result => (p.transpiled = String(result.code).replace('"use strict";\n\n', '')))
        )
      )
    }

    return {
      ...instructions,
      parsed: instructions.parsed.map(i => ({
        ...i,
        ...(options.transpile !== false &&
          i.type === 'ImportDeclaration' && {
            varName: String(i.transpiled || i.statement)
              .split('=')[0]
              .replace(/^var\s/, '')
              .trim(),
          }),
        transpiled: i.transpiled || i.statement,
      })),
    }
  }

  /**
   * WIP. statically analyze what a module exports without running the code
   */
  get exportBlocks() {
    const { isEmpty, isNull, uniq, flatten } = this.lodash
    const { exportDeclarations = [] } = this

    const names = exportDeclarations.map(item => {
      const { node } = item
      switch (node.type) {
        case 'ExportDefaultDeclaration':
          const startLine = node.loc.start.line - 1
          const endLine = node.loc.end.line - 1

          return startLine !== endLine
            ? this.lines.slice(startLine, endLine + 1).join('\n')
            : this.lines[startLine]
        case 'ExportNamedDeclaration':
          if (isNull(node.declaration) && !isEmpty(node.specifiers)) {
            const startLine = node.loc.start.line - 1
            const endLine = node.loc.end.line - 1

            return startLine !== endLine
              ? this.lines.slice(startLine, endLine + 1).join('\n')
              : this.lines[startLine]
          } else if (!isNull(node.declaration) && !isEmpty(node.declaration.declarations)) {
            const startLine = node.loc.start.line - 1
            const endLine = node.loc.end.line - 1
            return startLine !== endLine
              ? this.lines.slice(startLine, endLine).join('\n')
              : this.lines[startLine]
          } else {
            return node
          }
        default:
          return undefined
      }
    })

    return uniq(flatten(names).filter(Boolean))
  }

  ensureState() {
    if (!this.parsedAst) {
      throw new Error('Must call parse() first')
    }

    return this
  }

  static attach(runtime, options = {}) {
    Helper.attach(runtime, Babel, {
      registry: Helper.createContextRegistry('scripts', {
        context: Helper.createMockContext(),
        api: { discover, filter, findAllBy },
      }),
      registryProp: 'scripts',
      lookupProp: 'script',
      ...options,
    })

    runtime.scripts.getter('runtime', () => runtime)
  }
}

export const attach = (...args) => Script.attach(...args)

export default Babel

function findAllBy(...args) {
  return this.available.map(id => this.runtime.script(id)).filter(...args)
}

function filter(iterator) {
  return this.findAllBy(iterator)
}
