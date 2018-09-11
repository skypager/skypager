const { getOptions } = require('loader-utils')

const unified = require('unified')
const visit = require('unist-util-visit')
const parse = require('remark-parse')
const stringify = require('remark-stringify')
const frontmatter = require('remark-frontmatter')
const toMDXAST = require('@mdx-js/mdxast')
const mdx = require('@mdx-js/mdx')
const matter = require('gray-matter')
const findBefore = require('unist-util-find-before')
const toString = require('mdast-util-to-string')
const kebabCase = require('lodash/kebabCase')

module.exports = async function(raw) {
  const callback = this.async()
  const options = getOptions(this)

  const tree = unified()
    .use(parse)
    .use(stringify)
    .use(stringifier)

  const { content, data: meta } = matter(raw)

  const ast = tree.parse(content)

  const compile = (src, o = {}) =>
    mdx(src, {
      mdPlugins: [replaceImages.bind(this)],
      hastPlugins: [syncAstNodes(ast, this.resourcePath)]
    })

  const toMdx = (a, o) => toMDXAST(o)(a)
  const mdxast = toMdx(ast, options)
  const result = await compile(content, options)

  let headingsMap
    
  try {
  headingsMap = ast.children.reduce((memo, node) => {
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
  }, {
    lines: {},
    headings: {}
  })

  } catch(error) {
    headingsMap = { message: error.message }
  }
  
  let code = [
    `import React from 'react'`,
    `import { MDXTag } from '@mdx-js/tag'`,
    !result.match('export const meta') ? 'export const meta = {}' : undefined,
    `typeof meta !== 'undefined' && Object.assign(meta, ${JSON.stringify(meta)}, meta)`,
    `export const ast = ${JSON.stringify(mdxast, null, 2)}`,
    `export const headingsMap = ${JSON.stringify(headingsMap, null, 2)}`,
    result,
  ].filter(Boolean)

  if (options && typeof options.procedure === 'function') {
    code =
      options.procedure(code, {
        toMdx,
        compile,
        ast,
        mdxast,
        result,
        content,
        loaderContext: this,
        tree,
        stringify,
      }) || code
  }

  return callback(null, typeof code === 'string' ? code : code.join('\n'))
}

function stringifier() {
  const { Compiler } = this
  const { visitors } = Compiler.prototype

  visitors.jsx = node => node.value
  visitors.import = node => node.value
  visitors.export = node => node.value
}

function replaceImages(options = {}) {
  const res = id => this.resolve(id)

  function transformer(tree) {
    visit(tree, 'image', node => {
      if (node.url.match(/^(\.|\w).*\.(png|jpg|gif|bmp|svg)/)) {
        node.type = 'html'

        let dimensions = ``

        if (node.url.match(/=.*$/)) {
          node.url = node.url.replace(/=.*$/, '')
          dimensions = node.url.split('=').slice(1)[0] || ''

          const [width, height] = dimensions.split(/x/i).map(i => i.trim())

          if (width && width.length) {
            dimensions = `width='${width}' `
          }
          if (height && height.length) {
            dimensions = `${dimensions} height='${height}'`
          }
        }

        node.value = `<img class="image-embed ${node.url
          .split('.')
          .pop()}-image-embed" ${dimensions} ${node.alt ? `alt='${node.alt}'` : ''} src={require('${
          node.url
        }')} />`
        delete node.children
      } else {
        console.log('node didnt match')
      }
    })

    return tree
  }

  return transformer
}

function syncAstNodes(withAst, filePath) {

  const findNode = (position) =>
    withAst.children.find(node => node.position && node.position.start.line === position.start.line)

  const tagWithLineNumber = (node) => {
    if (!node.position || !node.position.start) {
      return node
    } else {
      const { properties = {} } = node
      return Object.assign({}, node, {
        properties: Object.assign({}, properties, {
          ['data-line-number']: node.position.start.line
        })
      })
    }
  } 

  return function(options) {
    return function(tree) {
      const ast = withAst
      const withLineNumbers = Object.assign({}, tree, {
        children: tree.children
          .map(tagWithLineNumber)
          .map((node) => {
            if (node.position) {
              try {
                const matchingNode = findNode(node.position)
                const parentHeading = findBefore(ast, matchingNode, 'heading')
  
                if (parentHeading) {
                  node.properties['data-parent-heading'] = parentHeading.position.start.line
                }
              } catch(error) {
                console.error(`Error parsing headings map for markdown file: ${filePath}`)
              }
            }
            
            return node  
          })
      })

      return withLineNumbers
    }
  }
}
