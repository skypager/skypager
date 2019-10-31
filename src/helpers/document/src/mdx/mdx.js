import { Helper } from '@skypager/runtime'
import { discover } from './discover'
import visit from 'unist-util-visit'
import { select, selectAll } from 'unist-util-select'
import findAfter from 'unist-util-find-after'
import findAllAfter from 'unist-util-find-all-after'
import findAllBefore from 'unist-util-find-all-before'
import nodeToString from 'mdast-util-to-string'

const registry = ({ name, members, scope, partialArg }) =>
  Helper.createContextRegistry(name, {
    context: Helper.createMockContext(members),
    wrapper: mod => partialRight(mod.bind(scope), partialArg),
  })

/**
 * @typedef {Object} Registry
 * @property {Function} lookup
 * @property {Function} register
 * @property {Function} checkKey
 * @property {Function} add
 */

/**
 * @typedef {Object} HeadingsMap
 * @property {Object} lines
 * @property {Object} headings
 */

/**
 * @typedef {Object} Coordinates
 * @property {Number} line
 * @property {Number} column
 * @property {Number} offset
 */

/**
 * @typedef {Object} Position
 * @property {Coordinates} start
 * @property {Coordinates} end
 */

/**
 * @typedef {Object} RemarkAST
 * @property {Array} children
 * @property {String} type
 * @property {Position} position
 */

/**
 * The Remark AST is made up of nodes. Nodes are
 * of a specific type based on their markdown syntax.  Every
 * node has a position in the document, line number and column
 *
 * @typedef {Object} RemarkASTNode
 * @property {String} type
 * @property {Array<RemarkASTNode>} children
 * @property {Position} position
 * @property {Number} [depth=undefined]
 */

/**
 * The Remark AST represents fenced codeblocks
 * with optional language identifiers as type=code
 * any additional name=value pairs that come after language
 * are arbitrary properties
 *
 * @typedef {Object} RemarkASTCodeNode
 * @property {String} type
 * @property {String} value
 * @property {String} lang
 * @property {Position} position
 */

/**
 * The Remark AST represents heading nodes with their depth
 * equal to the number of hashtags used to indicate heading level
 *
 * @typedef {Object} RemarkASTHeadingNode
 * @property {String} type
 * @property {Array<RemarkASTNode>} children
 * @property {Position} position
 * @property {Number} depth
 */

/**
 * A markdown link to a doc:// url will resolve to some action
 * which can render content in place of that link tag.
 *
 * @typedef {Object} ResolvedDocLink
 * @property {String} matched
 * @property {Object} params
 * @property {Object} props
 * @property {String} request
 * @property {String} protocol
 * @property {String} hostname
 * @property {String} path
 * @property {String} query
 */

/**
 * The Mdx Helper is a wrapper around markdown documents, and supports MDX.  Treats each document as a unique entity, with state,
 * and provides access to the documents content, its remark and rehype AST, metadata parsed from YAML frontmatter MDX's export const meta = {}.
 *
 * You can query each document to detect certain nodes, such as headings, lists, paragraphs, codeblocks etc.  The Mdx Helper attaches to the
 * skypager runtime and creates an mdxDocs property, which acts as a registry for all known Mdx instances found in the project.
 */
export class Mdx extends Helper {
  static isCacheable = true
  static isObservable = true

  /**
   * A lifecycle hook which creates registries of actions that can belong to this document.
   *
   * @private
   *
   */
  initialize() {
    const base = {
      scope: this,
      partialArg: { ...this.context, doc: this },
    }

    /**
     * @property {Registry} actions
     *
     */
    this.actions = registry({
      name: 'actions',
      members: this.tryResult('actions', {}),
      ...base,
    })

    /**
     * @property {Registry} sandboxes
     *
     */
    this.sandboxes = registry({
      name: 'sandboxes',
      members: this.tryResult('sandboxes', {}),
      ...base,
    })
  }

  /**
   * Sets the initial state of the document.  The document's state will track whether the content has been
   * parsed or not, which means we will have the AST.
   *
   * @private
   *
   */
  get initialState() {
    return {
      parsed: !!(this.options.ast || this.provider.ast),
    }
  }

  /**
   * Returns the document title, which is either specified in the document metadata
   * or by using the first heading encountered.  If no headings are encountered,
   * then we format the name of the document and try to guess the title based on that
   *
   * @type {String}
   *
   */
  get title() {
    const { title = this.options.title } = this.meta

    if (title) {
      return title
    }

    const { keys } = this.lodash
    const { titleize } = this.runtime.stringUtils
    const fromHeadings = keys(this.headingsMap.headings || {})[0]

    return (
      fromHeadings ||
      titleize(
        this.name
          .split('/')
          .pop()
          .replace(/\W+/g, ' ')
      )
    )
  }

  /**
   * The mdx webpack loader generates this heading element index by parsing the ast,
   * it tells us which headings are found and their line number in the document.
   *
   * The HeadingsMap lines maps line numbers to the heading text, and the headings map
   * shows which line numbers headings are on based on their text.
   *
   * @type {HeadingsMap}
   *
   */
  get headingsMap() {
    return (
      this.currentState.headingsMap ||
      this.tryGet('headingsMap', {
        lines: {},
        headings: {},
      })
    )
  }

  /**
   * The mdx webpack loader generates this property when either YAML frontmatter is encountered
   * or if the document uses actual mdx syntax and exports a meta property.
   *
   * @type {Object}
   *
   */
  get meta() {
    // checks options.meta, fallsback to provider.meta
    const providedByDoc = this.currentState.meta || this.tryGet('meta', { id: this.name })
    const withDefaults = this.lodash.defaults({}, providedByDoc, { id: this.name })
    return withDefaults
  }

  /**
   * The @skypager/webpack/markdown-loader generates this property.  It is the remark ast that can be used to traverse
   * the markdown documents before rendering it as html or mdx.
   *
   * @type {RemarkAST}
   *
   */
  get ast() {
    return (
      this.currentState.ast ||
      this.tryGet('ast', {
        type: 'root',
        children: [],
        position: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      })
    )
  }

  /**
   * The @skypager/webpack/markdown-loader generates this property.  It is the rehype ast that can be used to traverse
   * the markdown documents before rendering it as React components.
   *
   * @type {RemarkAST}
   *
   */
  get rehypeAst() {
    return (
      this.currentState.rehypeAst ||
      this.tryGet('rehypeAst', {
        type: 'root',
        children: [],
        position: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        },
      })
    )
  }

  /**
   * Visit each node in the document's current AST.  Accepts a function which will be passed an instance of the AST node.
   *
   * @param {Function} fn
   * @param {RemarkAST} [base=this.ast] the AST to visit. Defaults to this documents, but can be any AST.
   *
   */
  visit(fn, base = this.ast) {
    return visit(base, fn)
  }

  /**
   * @param {RemarkASTNode} node get the plaintext content of a markdown AST node.
   * @returns {String}
   *
   */
  stringify(node) {
    return nodeToString(node)
  }

  /** 
   * @param {RemarkASTNode} beginNode the node to start
   * @param 
  */
  findNodesBetween(beginNode, endNode, options = {}) {
    const nodes = this.findAllNodesAfter(beginNode).filter((node) => node.position.end.line < endNode.position.end.line)

    if (options.wrap && nodes.length) {
      const { length, 0: first, [length - 1]: last } = nodes

      const lines = last.position.end.line = first.position.start.line

      const start = {
        ...first.position.start,
        line: first.position.start.line - lines,
      }

      const end = {
        ...last.position.end,
        line: last.position.end.line - lines
      }

      return {
        type: 'root',
        children: nodes,
        position: { start, end }
      }
    }

    return nodes
  }

  /**
   * Find all nodes after an index, or after the passed node.
   *
   * @param {Number|RemarkASTNode} indexOrNode the numeric index of a node, or the actual node you want to find after.
   * @param {String|Function} test
   * @param {RemarkAST} [base=this.ast] the ast the node belongs to, defaults to the current document's AST
   *
   * @returns {Array<RemarkASTNode>}
   */
  findAllNodesAfter(indexOrNode, test, base = this.ast) {
    return findAllAfter(base, indexOrNode, test)
  }

  /**
   * Find all nodes before an index, or after the passed node.
   *
   * @param {Number|RemarkASTNode} indexOrNode the numeric index of a node, or the actual node you want to find after.
   * @param {String|Function} test
   * @param {RemarkAST} [base=this.ast] the ast the node belongs to, defaults to the current document's AST
   *
   * @returns {Array<RemarkASTNode>}
   */
  findAllNodesBefore(indexOrNode, test, base = this.ast) {
    return findAllBefore(base, indexOrNode, test)
  }

  /**
   * Find the next node after an index, or after the passed node.
   *
   * @param {Number|RemarkASTNode} indexOrNode the numeric index of a node, or the actual node you want to find after.
   * @param {String|Function} test
   * @param {RemarkAST} [base=this.ast] the ast the node belongs to, defaults to the current document's AST
   *
   * @returns {RemarkASTNode}
   */
  findNodesAfter(indexOrNode, test, base = this.ast) {
    return findAfter(base, indexOrNode, test)
  }

  /**
   * Find all nodes using a css style selector
   *
   * @param {String} selector
   * @param {RemarkAST} [base=this.ast] the ast the node belongs to, defaults to the current document's AST
   *
   * @returns {Array<RemarkASTNode|RemarkASTHeadingNode|RemarkASTCodeNode>}
   */
  select(selector, base = this.ast) {
    return selectAll(selector, base)
  }

  /**
   * Find a single node using a css style selector
   *
   * @param {String} selector
   * @param {RemarkAST} [base=this.ast] the ast the node belongs to, defaults to the current document's AST
   *
   * @returns {RemarkASTNode|RemarkASTCodeNode|RemarkASTHeadingNode}
   */
  selectNode(selector, base = this.ast) {
    return select(selector, base)
  }

  /**
   * Returns the AST's top level child nodes.
   *
   *
   * @type {Array<RemarkASTNode>}
   */
  get body() {
    return this.ast.children || []
  }

  /**
   *
   * @type {Array<RemarkASTHeadingNode>}
   */
  get headingNodes() {
    return this.select('heading')
  }

  /**
   * Returns all of the nodes of type code.  Uses MDX's language tag parser to treat name=value pairs after the code's language
   * to treat these as abitrary attributes for the code block.  These attributes will be passed as props when we're using MDX
   * which lets us build our renderable and runnable example blocks.
   *
   *
   * @type {Array<RemarkASTCodeNode>}
   */
  get codeBlocks() {
    const metaToProps = ({ meta = '' } = {}) =>
      meta == undefined ? {} : String(meta)
        .split(' ')
        .reduce((memo, pair) => {
          const [name, value] = pair.split('=').map(v => v.trim())
          memo[name] = value
          return memo
        }, {})

    return this.body
      .filter(({ type }) => type === 'code')
      .map(block => ({
        ...metaToProps(block),
        ...block,
      }))
  }

  /**
   * Returns all the codeblocks where the language is defined as javascript
   *
   * @type {Array<RemarkASTCodeNode>}
   *
   */
  get javascriptBlocks() {
    return this.codeBlocks.filter(({ type, lang }) => type === 'code' && lang === 'javascript')
  }

  /**
   * Returns all the codeblocks where the language is defined as shell or sh
   *
   * @type {Array<RemarkASTCodeNode>}
   *
   */
  get shellBlocks() {
    return this.codeBlocks.filter(
      ({ type, lang }) => type === 'code' && (lang === 'shell' || lang === 'sh')
    )
  }

  /**
   * Returns information about all of the headings, their depth, and line numbers.
   *
   *
   * @type {Array<Array>}
   */
  get structure() {
    const { times, get, sortBy } = this.lodash
    const headings = sortBy(this.select('heading'), node => get(node, 'position.start.line'))

    return headings.map((node, i) => {
      const { depth, position } = node
      const content = this.stringify(node)
      return [content, depth, get(position, 'start.line')]
    })
  }

  /**
   * Finds the parent heading any node belongs to.
   *
   * @param {RemarkASTNode} node
   * @param {Object} options
   * @param {Boolean} options.stringify return the string content of the node instead of the node.
   *
   * @returns {String|RemarkASTHeadingNode|RemarkASTNode}
   */
  findParentHeading(node, options) {
    if (node && node.type === 'heading') {
      const parentHeading = this.findAllNodesBefore(
        node,
        ({ type, depth }) => type === 'heading' && depth < node.depth
      )[0]
      return parentHeading || this.headingNodes[0]
    }

    const headingNode = this.findAllNodesBefore(node, ({ type }) => type === 'heading')[0]

    if (!headingNode) {
      return
    }

    return options && options.stringify ? this.stringify(headingNode) : headingNode
  }

  /**
   * Every document has its own sandboxes registry, but all documents can use a shared registry
   * for common sandboxes.
   *
   *
   * @type {Registry}
   */
  get sharedSandboxes() {
    return this.runtime.mdx.sandboxes
  }

  /**
   * Every document has its own actions registry, but all documents can use a shared registry
   * for common actions.
   *
   *
   * @type {Registry}
   */
  get sharedActions() {
    return this.runtime.mdx.actions
  }

  /**
   * Get the value for a named sandbox, searching first in this document's sandbox registry
   * and then falling back to the shared sandboxes registry.
   *
   *
   * @param {String} sandboxId
   * @returns {Object}
   */
  sandbox(sandboxId) {
    const { partialRight } = this.lodash
    try {
      return this.sandboxes.lookup(sandboxId)
    } catch (error) {
      const fn = this.sharedSandboxes.lookup(sandboxId)
      return partialRight(fn.bind(this), { ...this.context, doc: this })
    }
  }
  /**
   * Get an action by its name.  An action is going to be a function that is bound to the instance of
   * this document.  The last argument passed to this function is going to be this document's context,
   * which includes references to runtime, the document itself, and all the runtime's dependency injection variables.
   *
   *
   * @param {String} actionId
   * @returns {Function}
   */
  action(actionId) {
    const { partialRight } = this.lodash
    try {
      return this.actions.lookup(actionId)
    } catch (error) {
      const fn = this.sharedActions.lookup(actionId)
      return partialRight(fn.bind(this), { ...this.context, doc: this })
    }
  }

  /**
   * Takes a resolved docLink (a URL wit the doc:// protocol) and returns content that can be rendered
   * in its place.  The content will be determined by whatever is returned from the action itself.
   *
   * @param {ResolvedDocLink} docLink
   * @returns {Object|String}
   */
  renderLinkTo(docLink = {}) {
    const actionId = docLink.matched
    const action = this.action(actionId)

    const output = action(
      {
        ...docLink.params,
        props: docLink.props || {},
        actionType: 'link',
      },
      {
        ...this.context,
        doc: this,
      }
    )

    return output
  }

  /**
   * Accepts a URL that starts with doc:// and turns it into an object that can be passed to
   * an action function.  This object is created by parsing the URL and treating the hostname, path, and query
   * parameters in a way that they can be used to power the magic link syntax we add into markdown.
   *
   * @returns {ResolvedDocLink}
   */
  resolveDocLink(url) {
    const { runtime } = this
    const { parseUrl, parseQueryString } = runtime.urlUtils
    const { isEmpty, mapKeys } = runtime.lodash

    const parsed = parseUrl(url)

    const params = mapKeys(isEmpty(parsed.query) ? {} : parseQueryString(parsed.query), (v, k) =>
      k.replace('[]', '')
    )

    const request = [parsed.host, parsed.path]
      .filter(v => !isEmpty(v))
      .join('/')
      .replace(/\?.*$/, '')
      .replace(/\/\//, '/')

    const matched = this.actions.checkKey(request) || this.runtime.mdxDocs.actions.checkKey(request)

    return {
      ...parsed,
      matched,
      request,
      params,
    }
  }

  /**
   * Returns the React component that was produced by the mdx webpack loader
   *
   * @readonly
   *
   */
  get Component() {
    const { componentExport = 'default' } = this.options
    return this.state.get(componentExport) || this.tryGet(componentExport)
  }

  static attach(runtime, options = {}) {
    Helper.attach(runtime, options.baseClass || Mdx, {
      registry: Helper.createContextRegistry('mdx', {
        context: Helper.createMockContext(),
        api: { discover, filter, findAllBy },
      }),
      registryProp: 'mdxDocs',
      lookupProp: 'mdxDoc',
      ...options,
    })

    runtime.mdxDocs.getter('runtime', () => runtime)

    runtime.mdxDocs.actions = Helper.createContextRegistry('actions', {
      context: Helper.createMockContext(options.actions || {}),
    })

    runtime.mdxDocs.sandboxes = Helper.createContextRegistry('sandboxes', {
      context: Helper.createMockContext(options.contexts || {}),
    })

    runtime.mdxDocs.actions.register('asset-loaders/imports-section', () => processImportSection)
  }
}

export const attach = (...args) => Mdx.attach(...args)

export default Mdx

function findAllBy(...args) {
  return this.chain
    .get('available')
    .map(id => this.runtime.doc(id))
    .filter(...args)
    .value()
}

function filter(...args) {
  return this.chain
    .invoke('allMembers')
    .entries()
    .map(([id, doc]) => ({
      ...doc,
      id,
    }))
    .filter(...args)
    .value()
}

function processImportSection(autoLoad = true) {
  const importSectionLine = this.headingsMap.headings.imports

  if (typeof importSectionLine === 'undefined') {
    return false
  }

  const listNodes = this.select('list')
  const importsList =
    listNodes.length &&
    listNodes.find(list => {
      const parentHeading = this.findParentHeading(list)
      return (
        parentHeading &&
        String(this.stringify(parentHeading))
          .toLowerCase()
          .trim()
          .startsWith('imports')
      )
    })

  if (!importsList) {
    return false
  }

  const links = this.select('link', importsList)

  const unpkgRequest = links.reduce(
    (memo, link) => ({
      ...memo,
      [this.stringify(link)]: link.url,
    }),
    {}
  )

  this.state.set('importDependencies', {
    ...(this.state.get('importDependencies') || {}),
    ...unpkgRequest,
  })

  this.runtime.bundle.register()

  if (autoLoad === true) {
    const { mapKeys } = this.lodash
    return Promise.resolve(this.runtime.assetLoader.unpkg(unpkgRequest)).then(response => {
      if (this.runtime.isFeatureEnabled('bundle') && this.runtime.bundle) {
        const payload = mapKeys(response, (v, k) => unpkgRequest[k].split('@')[0])
        this.runtime.bundle.register(payload)
      }

      this.state.set('vmSandbox', {
        ...(this.state.get('vmSandbox') || {}),
        ...response,
      })

      return response
    })
  } else {
    return unpkgRequest
  }
}
