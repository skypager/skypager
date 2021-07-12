require('@babel/register')()
const runtime = require('@skypager/node')
const crawler = require('../src')

runtime.use(crawler)

async function main() {
  const url = runtime.argv._[0] || 'https://soederpop.com'
  const crawler = runtime.crawler('main', {
    url,
  })

  await crawler.run({
    headless: false,
  })

  if (runtime.argv.lighthouse) {
    await crawler.lighthouse()

    const { mapValues } = runtime.lodash

    mapValues(crawler.lhr.categories, (v, k) => {
      console.log(`${v.title}: ${v.score}`)
    })

    const stacks = crawler.lhr.stackPacks.map(({ title }) => title)

    console.log('Stacks:', stacks.join(','))
  }

  if (runtime.argv.interactive) {
    await runtime.repl('interactive').launch({
      crawler,
      c: crawler,
      runtime,
    })

    console.log('REPL IS DONE MAN')
  } else {
    await crawler.close()
  }
}

main()
