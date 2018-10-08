const { readFileSync: readFile } = require('fs')
const { resolve } = require('path')
const mdx = require('../mdx-parser')
const runtime = require('@skypager/node')

const markdown = readFile(resolve(process.cwd(), 'test', 'fixtures', 'page.mdx')).toString()

describe('MDX Parser', function() {
  it('turns markdown files into react code', async function() {
    const code = await mdx(markdown, {})
    code.should.match(/export default/)
    code.should.match(/export const ast/)
  })

  it('can transpile using babel', async function() {
    const { code } = await mdx(markdown, {
      babel: {
        presetEnv: {
          modules: 'auto',
        },
      },
    })
    code.should.have.property('length').that.is.greaterThan(80)

    const mod = runtime.createModule(code, {
      require: require,
    })

    const { isValidElement, createElement } = require('react')
    const el = createElement(mod.exports.default)
    isValidElement(el).should.equal(true)
    const html = require('react-dom/server').renderToStaticMarkup(el)
    html.should.include(
      `<h1 data-line-number="2">MDX Page</h1><div class="ui segment">Hello World</div><p data-line-number="6"`
    )
  })
})
