#!/usr/bin/env node

const path = require('path')
const { existsSync } = require('fs')
let args = process.argv.slice(2)
const spawnSync = require('child_process').spawnSync
const script = args.shift()
const scriptFilename = `${script}.js`.replace(/\.js\.js/, '.js').replace(/:/g, '-')
const localScriptPath = path.resolve(process.cwd(), 'scripts', scriptFilename)
const ourScriptPath = path.resolve(__dirname, 'scripts/', scriptFilename)

let scriptPath = existsSync(localScriptPath) ? localScriptPath : ourScriptPath

const requestedHelp = script === 'help'

if (!existsSync(scriptPath)) {
  try {
    scriptPath = require.resolve(`@skypager/devtools/scripts/${scriptFilename}`)
  } catch (error) {}
}

if (!existsSync(scriptPath)) {
  try {
    scriptPath = require.resolve(`@skypager/webpack/scripts/${scriptFilename}`)
  } catch (error) {}
}

const checkPaths = [
  localScriptPath,
  ourScriptPath,
  `node_modules/@skypager/devtools/scripts/${scriptFilename}`,
  `node_modules/@skypager/webpack/scripts/${scriptFilename}`,
]

const scriptIsMissing = !existsSync(scriptPath)

const runtimeArgs = []

if (args.indexOf('--esm') !== -1 || process.env.SKYPAGER_ESM) {
  runtimeArgs.push('--require')
  runtimeArgs.push(require.resolve('esm'))
  args = args.filter(arg => arg !== '--esm')
}

if (args.indexOf('--babel') !== -1 || process.env.SKYPAGER_BABEL) {
  runtimeArgs.push('--require')
  runtimeArgs.push(require.resolve('@babel/register'))
  args = args.filter(arg => arg !== '--babel')
}

// pass --debug to the underlying command too since our logger implementation uses it
if (args.indexOf('--debug') !== -1) {
  runtimeArgs.push('--inspect')
}

if (args.indexOf('--inspect') !== -1) {
  runtimeArgs.push('--inspect')
  args = args.filter(arg => arg !== '--inspect')
}

if (args.indexOf('--global-sandbox') !== -1) {
  runtimeArgs.push('--require')
  runtimeArgs.push('@skypager/node/context.js')
}

if (requestedHelp) {
  require('./scripts/list-all-scripts')
    .listAllScripts({ verbose: false })
    .then(scriptsData => {
      console.log('Skypager CLI')
      console.log(`Version: ${require('./package.json').version}`)
      const { validScripts = [] } = scriptsData
      const cliScripts = validScripts.find(e => e[0] === '@skypager/cli')[1]

      const rest = validScripts.slice(1).filter(e => e[1] && e[1].length)

      console.log('\nScripts provided by @skypager/cli:')

      cliScripts.forEach(script => {
        console.log(`  - ${script.replace('.js', '')}`)
      })

      console.log("\n\nRun 'skypager $script help' to get detailed command info.\n")
      console.log('  Example:\n')
      console.log('  $ skypager console help')
    })
    .then(() => {
      process.exit(0)
    })
} else if (scriptIsMissing) {
  require('./find-command')(scriptFilename, checkPaths, runtimeArgs, args)
    .then(result => process.exit(0))
    .catch(error => process.exit(1)) // eslint-disable-line
} else {
  try {
    const result = spawnSync('node', [...runtimeArgs, scriptPath].concat(args), {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    process.exit(result.status)
  } catch (error) {
    process.exit(1)
  }
}
