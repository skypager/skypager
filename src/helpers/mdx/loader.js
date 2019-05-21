const { getOptions } = require('loader-utils')
const mdx = require('./parser')
const visit = require('unist-util-visit')

module.exports = async function(raw) {
  const callback = this.async()
  const options = getOptions(this)

  this.cacheable && this.cacheable()

  const remarkPlugins = [replaceImages.bind(this)]

  const response = await mdx(
    raw,
    Object.assign({}, options, { filePath: this.resourcePath, remarkPlugins })
  )

  callback(null, response.code)
}

function replaceImages(options = {}) {
  const parse = url => require('url').parse(url)

  function transformer(tree) {
    visit(tree, 'image', node => {
      const parsed = parse(node.url)

      if (parsed.path.match(/^(\.|\w).*\.(png|jpg|gif|bmp|svg)/)) {
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

        const fileExtension = parsed.path.split('.').pop()
        const imageClassPrefix = `${fileExtension}-image-embed`
        const altContent = node.alt ? `alt='${node.alt}'` : ''
        const imageSrc =
          parsed.protocol === 'http' || parsed.protocol === 'https'
            ? `"${node.url}"`
            : `{require('${node.url}')}`

        node.value = `<img class="image-embed ${imageClassPrefix}" ${dimensions} ${altContent} src=${imageSrc} />`

        delete node.children
      } else {
        console.log('node didnt match')
      }
    })

    return tree
  }

  return transformer
}
