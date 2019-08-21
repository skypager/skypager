/**
 * This runs the babel compilation for the libraries which are needed to run the rest of the build and test suite.
 */
const { spawn } = require('child-process-promise')

const packages = [
  '@skypager/runtime',
  '@skypager/node',
  '@skypager/helpers-client',
  '@skypager/helpers-server',
  '@skypager/features-file-manager',
  '@skypager/features-package-manager',
  '@skypager/features-module-manager',
  '@skypager/helpers-repl',
]

const scopes = packages.reduce((memo, pkg) => memo.concat(['--scope', pkg]), [])

const buildCommand = process.env.BUILD_COMMAND || 'build:lib'

async function main() {
  await spawn('lerna', ['run', buildCommand, '--stream'].concat(scopes), {
    stdio: 'inherit',
  }).catch(error => {
    process.exit(1)
  })
  await spawn('yarn', ['workspace', '@skypager/runtime', 'build:es'], {
    stdio: 'inherit'
  })
}

main().then(() => process.exit(0))
