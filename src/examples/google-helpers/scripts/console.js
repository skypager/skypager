const runtime = require('@skypager/node')
const DocHelper = require('@skypager/helpers-document')

runtime.use(DocHelper)

async function main() {
  await runtime.mdxDocs.discover()
  const siteTemplate = runtime.mdxDoc('SITE-TEMPLATE')
  const runnable = runtime.mdxDoc('docs/runnable')

  await Promise.all([siteTemplate.process(), runnable.process()])

  await runtime.repl('interactive').launch({
    runtime,
    runnable,
    siteTemplate,
    site: siteTemplate,
  })
}

main()
