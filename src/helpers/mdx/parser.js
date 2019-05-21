const unified = require('unified')
const parse = require('remark-parse')
const stringify = require('remark-stringify')
const toMDXAST = require('@mdx-js/mdxast')
const mdx = require('@mdx-js/mdx')
const matter = require('gray-matter')
const findBefore = require('unist-util-find-before')
const toString = require('mdast-util-to-string')
const kebabCase = require('lodash/kebabCase')
const omit = require('lodash/omit')
const castArray = require('lodash/castArray')
const visit = require('unist-util-visit')

/**
 * @param {String} raw raw mdx content
 * @param {Object} options options
 * @param {String} options.filePath the path to the file
 * @param {Boolean|Object} [options.babel=false] whether to transpile otherwise es6 / jsx output returned from mdx
 * @param {Array} [options.remarkPlugins=[]] remark plugins
 * @param {Array} [options.rehypePlugins=[]] rehype plugins
 */
module.exports = async function(raw, options) {
  const tree = unified()
    .use(parse)
    .use(stringify)
    .use(stringifier)

  const { content, data: meta } = matter(raw)

  let ast = tree.parse(content)
  let mdxast

  const captureAst = () => (tree) => {
    mdxast = tree
    // console.log('capturing ast', mdxast, tree)
    return tree
  } 

  const captureMeta = () => (tree) => {
    // console.log('capturing meta', tree)
    visit(tree, (node) => {
      if (node.type === 'code' && node.lang && node.lang.match(/\w+\s.*/)) {
        const parts = node.lang.split(' ')[0]
        node.lang = parts[0]
        node.meta = parts.slice(1).join(" ")
      }
    }) 

    return tree
  }

  const syncCodeBlocks = () => (tree) => {
    tree.children.forEach((child) => {
      if (child.type === 'element' && child.tagName === 'pre' && child.children && child.children[0].tagName === 'code') {
        const { properties = {} } = child
        const code = child.children[0]
        code.properties = Object.assign(code.properties, properties)
      }
    })
  }

  const injectRemarkPlugins = [captureMeta]
  const injectRehypePlugins = [syncCodeBlocks]

  const compile = (src, { filePath = options.filePath } = {}) =>
    mdx(src, {
      remarkPlugins: injectRemarkPlugins.concat(options.remarkPlugins || options.mdPlugins || []).concat([captureAst]),
      rehypePlugins: [syncAstNodes(ast, filePath)].concat(injectRehypePlugins).concat(options.rehypePlugins || options.hastPlugins || []),
    })

  const toMdx = (a, o) => toMDXAST(o)(a)
  const getAst = () => mdxast || toMdx(ast, options)
  const result = await compile(content, options)

  let headingsMap

  try {
    headingsMap = ast.children.reduce(
      (memo, node) => {
        if (node.type === 'heading') {
          const string = toString(node)
          const pos = node.position.start.line
          const slug = kebabCase(string.toLowerCase())

          memo.lines[pos] = string
          memo.headings[string] = memo.lines[string] || []
          memo.headings[slug] = memo.lines[slug] || []

          memo.headings[string].push(pos)
          memo.headings[slug].push(pos)

          return memo
        } else {
          return memo
        }
      },
      {
        lines: {},
        headings: {},
      }
    )
  } catch (error) {
    headingsMap = { message: error.message }
  }

  let injectLines = castArray(options.injectCode).filter(v => v && v.length)
  
  let code = [
    `import React from 'react'`,
    `import { mdx } from '@mdx-js/react'`,
    !result.match('export const meta') ? 'export const meta = {}' : undefined,
    `typeof meta !== 'undefined' && Object.assign(meta, ${JSON.stringify(meta)}, meta)`,
    `export const ast = ${JSON.stringify(mdxast || getAst(), null, 2)}`,
    `export const headingsMap = ${JSON.stringify(headingsMap, null, 2)}`,
    ...injectLines,
    result,
  ].filter(Boolean)

  let response = code.join('\n')

  if (options.babel) {
    const babel = require('@babel/core')
    const babelConfig =
      typeof options.babelConfig === 'object'
        ? options.babelConfig
        : require('./babel-config')(typeof options.babel === 'object' ? options.babel : {})

    const transpiled = await new Promise((resolve, reject) => {
      babel.transform(response, omit(babelConfig, 'ignore', 'env'), (err, result) => {
        err ? reject(err) : resolve(result)
      })
    })

    response = transpiled
  }

  return { code: response, meta, ast: mdxast, headingsMap }
}

function stringifier() {
  const { Compiler } = this
  const { visitors } = Compiler.prototype

  visitors.jsx = node => node.value
  visitors.import = node => node.value
  visitors.export = node => node.value
}

function syncAstNodes(withAst, filePath) {
  const findNode = position =>
    withAst.children.find(node => node.position && node.position.start.line === position.start.line)

  const tagWithLineNumber = node => {
    if (!node.position || !node.position.start) {
      return node
    } else {
      const { properties = {} } = node
      return Object.assign({}, node, {
        properties: Object.assign({}, properties, {
          'data-line-number': node.position.start.line,
        }),
      })
    }
  }

  return function(options) {
    return function(tree) {
      const ast = withAst
      const withLineNumbers = Object.assign({}, tree, {
        children: tree.children.map(tagWithLineNumber).map(node => {
          if (node.position) {
            try {
              const matchingNode = findNode(node.position)
              const parentHeading = findBefore(ast, matchingNode, 'heading')

              if (parentHeading) {
                node.properties['data-parent-heading'] = parentHeading.position.start.line
              }
            } catch (error) {
              console.error(`Error parsing headings map for markdown file: ${filePath}`)
            }
          }

          return node
        }),
      })

      return withLineNumbers
    }
  }
}
