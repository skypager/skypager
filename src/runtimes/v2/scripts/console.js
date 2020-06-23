require('@babel/register')()
const skypager = require('@skypager/node')

async function main() {
  const r = require('../lib').default
  await skypager.repl('interactive').launch({ r })
}

main()
