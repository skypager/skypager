process.env.BUILD_ENV = 'build'
require('@babel/register')()
require('babel-plugin-require-context-hook/register')()
const runtime = require('@skypager/node')

main()

async function main() {
  const cmd = runtime.argv._[0]

  if (cmd === 'console') {
    await runtime.repl('interactive').launch({ runtime })
  } else if (cmd === 'run') {
    const example = runtime.argv._[1] || 'library'
    await require(`../examples/${example}.js`).default()
  }
}
