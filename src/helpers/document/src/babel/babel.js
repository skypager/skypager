import { Helper } from '@skypager/runtime'
import { discover } from './discover'
import * as core from '@babel/core'
import traverse from '@babel/traverse'
import types from '@babel/types'

/**
 * The Script Helper lets us work with our JavaScript files and their AST
 *
 * @export
 * @class Script
 * @extends {Helper}
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

  initialize() {
    this.lazy('lines', () => this.content.split('\n'))
  }
  /**
   * Uses this.content and creates a @babel AST using @babel/core's parse function
   * using the babel config
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
   * @param {Object} options.babel - options to be passed to the babel config generator (presetEnv)
   * @param {Object} options.babelConfig - supply your own babel config don't generate any
   * @param {Array} options.body - replace the body of our current ast program with a new body
   * @param {String} options.code - code to use for sourcemap generation
   * @param {Boolean} options.parse - create a new module from the generated code and return the module.exports
   *
   * @return {Object} returns a babel transform object, with code, ast, map properties
   */
  async transformAst(options = {}) {
    const { runtime } = this
    const { body, code = this.contents } = options
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

  /**
   * Given two location objects { start: { line, column }, end: { line, column } }
   * or a single node with a loc.property that has start and end Position objects,
   * returns an object with a toString() method that will return the source for that node
   * 
   * @param {SourcePosition} begin
   * @param {SourcePosition} end
   */
  extractSourceFromLocations(begin, end) {
    const { clone, isUndefined, get } = this.lodash

    if (begin && begin.loc && begin.loc.start && begin.loc.end && !end) {
      end = begin.loc
      begin = begin.loc
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
   */
  get babel() {
    return { core, types, traverse }
  }

  /**
   * Returns babel config for use with parse() and transform() methods
   */
  getBabelConfig(options = {}) {
    const { omit, pick } = this.lodash

    options = { ...pick(this.options, 'babel', 'babelConfig'), ...options }

    const babelOptions =
      typeof options.babel === 'object'
        ? options.babel
        : { transformRuntime: true, presetEnv: { modules: 'auto' } }

    const babelConfig = options.babelConfig || require('./babel-config')(babelOptions)

    return omit(babelConfig, 'env', 'ignore')
  }

  /**
   * Returns the ast that parse() generated.
   */
  get ast() {
    this.ensureState()
    return this.parsedAst
  }

  /**
   * Replaces the current AST with a new one
   */
  set ast(value) {
    this.hide('parsedAst', value)
  }

  /**
   * Provides access to the comment nodes in the script
   */
  get comments() {
    const { get } = this.lodash
    return get(this, 'ast.program.comments', [])
  }

  /**
   * The body section of the ast.program are the main nodes in the script
   */
  get body() {
    const { get } = this.lodash
    return get(this, 'ast.program.body', [])
  }

  get bodyNodeTypes() {
    return this.body.map(node => node.type)
  }

  /**
   * The file content of the script.  May include wrapper content if the script helper instance or the scripts registry has a wrapContent function
   */
  get content() {
    const wrapper = this.tryGet('wrapper', this.context.reg.wrapContent)
    return typeof wrapper === 'function'
      ? wrapper(this.unwrappedContent, this)
      : this.unwrappedContent
  }

  get unwrappedContent() {
    return this.currentState.content || this.options.content || this.provider.content || this.get('file.content')
  }

  get file() {
    return this.currentState.file || this.options.file || this.provider.file
  }
  /**
   * Gives us all of the nodes of type ImportDeclaration
   */
  get importDeclarations() {
    return this.body.filter(node => node.type === 'ImportDeclaration')
  }

  /**
   * Gives us all of the nodes that export something from the module
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
   * Lists the modules the script imports using es6 import syntax
   */
  get importsModules() {
    return this.importDeclarations
      .map(node => node && node.source && node.source.value)
      .filter(Boolean)
  }

  /**
   * Given the name of an export (e.g. pageSelectors, path) return the babel nodes that define them
   */
  findNodesByExportName(...exportNames) {
    const { sortBy } = this.lodash

    const nodeIndexes = sortBy(
      this.exportData.filter(node => exportNames.indexOf(node.name) !== -1),
      'index'
    ).map(node => node.index)

    return nodeIndexes.map(index => this.body[index])
  }

  get exportNames() {
    return this.exportData.map(exp => exp.name)
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
            exportName: get(node, 'declaration.name'),
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

function findAllBy(registry, ...args) {
  return registry.chain
    .get('available')
    .map(id => this.runtime.script(id))
    .filter(...args)
    .value()
}

function filter(registry, ...args) {
  return registry.chain
    .invoke('allMembers')
    .entries()
    .map(([id, script]) => ({
      ...script,
      id,
    }))
    .filter(...args)
    .value()
}
