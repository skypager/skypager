const { spawnSync } = require('child_process')
const { existsSync } = require('fs')
const { resolve } = require('path')
const spawnEnv = Object.assign({}, process.env, {
  NODE_ENV: 'test',
  BUILD_ENV: 'build',
})

const ARGV = require('minimist')(process.argv.slice(2))

let testFramework = 'mocha-webpack'

let args = process.argv.slice(2)

if (ARGV.mocha) {
  args = args.filter(a => a !== '--mocha')
  testFramework = 'mocha'
} else if (ARGV.jest) {
  args = args.filter(a => a !== '--jest')
  testFramework = 'jest'
} else {
  testFramework = 'mocha-webpack'
}

if (testFramework === 'mocha-webpack') {
  require('./test-with-mocha-webpack')
} else if (testFramework === 'mocha') {
  if (ARGV.debugger) {
    args.unshift('--inspect')
  }

  if (ARGV.babel !== false) {
    args.push(...['--require', require.resolve('@babel/register')])
  }

  if (existsSync(resolve(process.cwd(), 'test', 'test.js'))) {
    args = args.concat(['--file', 'test/test.js'])
  } else {
    args = args.concat(['--file', resolve(__dirname, '..', 'testing', 'mocha-test-setup.js')])
  }

  args = args.concat(ARGV._)
} else if (testFramework === 'jest') {
}

console.log(`$ ${testFramework} ${args.join(' ')}`)
const result = spawnSync(testFramework, args, {
  cwd: process.cwd(),
  env: spawnEnv,
  stdio: 'inherit',
})

process.exit(result.status)
