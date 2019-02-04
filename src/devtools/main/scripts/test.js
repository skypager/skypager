const { spawnSync } = require('child_process')
const { existsSync } = require('fs')
const { resolve } = require('path')
const { flatten } = require('lodash')
const mochaWebpackBin = require('mocha-webpack/package.json').bin['mocha-webpack']
const mochaWebpackBinPath = require.resolve(`mocha-webpack/${mochaWebpackBin}`)
const spawnEnv = Object.assign({}, process.env, {
  NODE_ENV: 'test',
})

const ARGV = require('minimist')(process.argv.slice(2))
const paths = require('@skypager/webpack/config/paths')
const baseConfigPath = require.resolve('@skypager/webpack/config/webpack.config.test')
const webpackConfigPath = ARGV['webpack-config']
  ? resolve(paths.appPackageJson, ARGV['webpack-config'])
  : baseConfigPath
const manifest = require(paths.appPackageJson)

const rest = ARGV._ || []
const { skypager: config = {} } = manifest
const { test = {} } = config
const { pattern = 'test/**/*.spec.js' } = Object.assign({}, test, ARGV)

if (!rest.length) {
  rest.push(pattern)
}

let args = [mochaWebpackBinPath]

if (!ARGV['webpack-config']) {
  args = args.concat(['--webpack-config', webpackConfigPath])
}

if (existsSync(resolve(paths.appRoot, 'test', 'test.js'))) {
  args = args.concat(['--require', 'test/test.js'])
} else {
  args = args.concat(['--require', resolve(__dirname, '..', 'testing', 'mocha-test-setup.js')])
}

args = args
  .concat(
    flatten(
      Object.keys(ARGV)
        .filter(k => k !== '_' && k !== 'debug')
        .map(k => [`--${k}`, ARGV[k]])
    )
  )
  .concat(rest)

if (ARGV.debug) {
  args.unshift('--inspect')
}

if (ARGV.debugBrk) {
  args.unshift('--inspect-brk')
}

try {
  const result = spawnSync('node', args, {
    cwd: paths.appRoot,
    env: spawnEnv,
    stdio: 'inherit',
  })

  process.exit(result.status)
} catch (error) {
  process.exit(1)
}
