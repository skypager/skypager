const runtime = require('@skypager/node')
const DocHelper = require('@skypager/helpers-document')

runtime.use(DocHelper)

async function main() {
  await runtime.mdxDocs.discover()
  const siteTemplate = runtime.mdxDoc('SITE-TEMPLATE')

  await siteTemplate.process()

  await runtime.repl('interactive').launch({ runtime, siteTemplate })
}

main()