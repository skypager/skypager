const { getOptions } = require('loader-utils')
const mdx = require('./mdx-parser')
const visit = require('unist-util-visit')

module.exports = async function(raw) {
  this.cacheable && this.cacheable()
  const callback = this.async()
  const options = getOptions(this)

  const mdPlugins = [replaceImages.bind(this)]

  const response = await mdx(
    raw,
    Object.assign({}, options, { filePath: this.resourcePath, mdPlugins })
  )

  callback(null, response)
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
