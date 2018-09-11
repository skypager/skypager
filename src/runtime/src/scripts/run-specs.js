const { colors, print, clear, icon } = project.cli

const omitBlocks = ['setup', 'teardown']
const omit = require('lodash/omit')

function runSpecs() {
  project.cache.clear()
  const specDocs = project.query('*.spec.md', false)
  print('Running Spec Documents', 2, 2, 2)

  specDocs.forEach(doc => {
    runCodeBlocks(doc).then(result => {})
  })
}

async function runCodeBlocks(doc) {
  print(colors.blue(doc.documentTitle()), 4)

  const headingsMap = doc.createHeadingsMap('accessor')
  const codeBlocks = doc
    .compileCodeBlocks()
    .pickBy(
      (v, k) => (k === 'setup' || k === 'teardown' || k.indexOf('specs/') === 0) && v.length > 0
    )
    .value()

  const setupBlocks = codeBlocks.setup || []
  const teardownBlocks = codeBlocks.teardown || []

  delete codeBlocks.setup
  delete codeBlocks.teardown

  const specBlocks = project.chain
    .plant(codeBlocks)
    .values()
    .flatten()
    .sortBy(b => b.index)
    .value()

  const setupResults = await Promise.all(setupBlocks.map(b => b.run()))
  const specResults = await Promise.all(specBlocks.map(b => b.run()))

  setupResults.forEach(block => {
    if (block.error) {
      print('There was an error running the setup block', 6)
      print(block.error.message, 8, 2, 2)
    }
  })

  specResults.forEach(block => {
    const title = headingsMap[block.accessor].textContent()
    const result = !block.error ? colors.green('OK') : colors.red('FAIL')
    print(`${title} ${result}`, 6, 0)
  })
}

runSpecs()
