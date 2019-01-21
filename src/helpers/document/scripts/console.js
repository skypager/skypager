const runtime = require('@skypager/node')

runtime.use(require('..'))

async function main() {
  runtime.repl('interactive').launch({
    runtime,
  })
}

main()
