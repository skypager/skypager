import { Helper } from '@skypager/runtime'
import { discover } from './discover'
import visit from 'unist-util-visit'
import { select, selectAll } from 'unist-util-select'
import findAfter from 'unist-util-find-after'
import findAllAfter from 'unist-util-find-all-after'
import findAllBefore from 'unist-util-find-all-before'
import nodeToString from 'mdast-util-to-string'

/**
 * The Mdx Helper is a wrapper for working with markdown or mdx documents.
 *
 * @export
 * @classMdx
 * @extends {Helper}
 */
export class Mdx extends Helper {
  // every call to runtime.page(pageId) will produce a new instance of a page
  static isCacheable = false

  // each instance of a page has observable state
  static isObservable = true

  get initialState() {
    return {
      parsed: !!(this.options.ast || this.provider.ast),
    }
  }
  /**
   * Returns the document title, which is either specified in the document metadata
   * or by using the first heading encountered.  If no headings are encountered,
   * then we format the name of the document and try to guess the title based on that
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
   * or if the document uses actual mdx syntax and exports a meta property
   */
  get meta() {
    // checks options.meta, fallsback to provider.meta
    const providedByDoc = this.currentState.meta || this.tryGet('meta', { id: this.name })
    const withDefaults = this.lodash.defaults({}, providedByDoc, { id: this.name })
    return withDefaults
  }

  /**
   * The @skypager/webpack/markdown-loader generates this property.  It is the remark ast that can be used to traverse
   * the markdown documents before rendering it as html or mdx
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

  visit(fn, base = this.ast) {
    return visit(base, fn)
  }

  stringify(node) {
    return nodeToString(node)
  }

  findAllNodesAfter(indexOrNode, test, base = this.ast) {
    return findAllAfter(base, indexOrNode, test)
  }

  findAllNodesBefore(indexOrNode, test, base = this.ast) {
    return findAllBefore(base, indexOrNode, test)
  }

  findNodesAfter(indexOrNode, test, base = this.ast) {
    return findAfter(base, indexOrNode, test)
  }

  select(selector, base = this.ast) {
    return selectAll(selector, base)
  }

  selectNode(selector, base = this.ast) {
    return select(selector, base)
  }

  get body() {
    return this.ast.children || []
  }

  get codeBlocks() {
    return this.body.filter(({ type }) => type === 'code')
  }

  get javascriptBlocks() {
    return this.body.filter(({ type, lang }) => type === 'code' && lang === 'javascript')
  }

  get shellBlocks() {
    return this.body.filter(
      ({ type, lang }) => type === 'code' && (lang === 'shell' || lang === 'sh')
    )
  }

  get structure() {
    const { times, get, sortBy } = this.lodash
    const headings = sortBy(this.select('heading'), node => get(node, 'position.start.line'))

    return headings.map((node, i) => {
      const { depth, position } = node
      const content = this.stringify(node)
      return [content, depth, get(position, 'start.line')]
    })
  }
  
  findParentHeading(node, options = {}) {
    const headingNode = this.findAllNodesBefore(node, ({ type }) => type === 'heading')[0]

    if (!headingNode) {
      return
    }

    return options.stringify ? this.stringify(headingNode) : headingNode
  }

  /**
   * Returns the React component that was produced by the mdx webpack loader
   *
   * @readonly
   * @memberofMdx
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
