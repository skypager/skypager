if (process.env.CI || process.env.JOB_NAME) {
  // we only need to do this on the developer machines right now
  // until we're publishing from CI
  process.exit(0)
}

const fs = require('fs')
const path = require('path')

const web = require('../../runtimes/web/package.json')
const universal = require('../../runtime/package.json')
const node = require('../../runtimes/node/package.json')
const cli = require('../../devtools/cli/package.json')
const main = require('../package.json')
const mainDistPath = path.resolve(__dirname, '..', 'lib')

const sig = deps =>
  Object.keys(deps)
    .sort()
    .map(name => `${name}:${deps[name].replace('^', '')}`)
    .join('\n')

const current = sig(main.dependencies)
const should = sig({
  '@skypager/web': web.version,
  '@skypager/cli': cli.version,
  '@skypager/node': node.version,
  '@skypager/runtime': universal.version,
})

if (current === should) {
  process.exit(0)
}

if (!fs.existsSync(mainDistPath)) {
  fs.mkdirSync(mainDistPath)
}

fs.copyFileSync(
  path.resolve(__dirname, '..', '..', 'runtime', 'lib', 'skypager-runtime.js'),
  path.resolve(mainDistPath, 'skypager-runtime.js')
)

fs.copyFileSync(
  path.resolve(__dirname, '..', '..', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.js'),
  path.resolve(mainDistPath, 'skypager-runtimes-web.js')
)

fs.copyFileSync(
  path.resolve(__dirname, '..', '..', 'runtime', 'lib', 'skypager-runtime.min.js'),
  path.resolve(mainDistPath, 'skypager-runtime.min.js')
)

fs.copyFileSync(
  path.resolve(__dirname, '..', '..', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.min.js'),
  path.resolve(mainDistPath, 'skypager-runtimes-web.min.js')
)

const updatedPackage = Object.assign({}, main)

updatedPackage.dependencies = Object.assign({}, updatedPackage.dependencies, {
  [cli.name]: `^${cli.version}`,
  [node.name]: `^${node.version}`,
  [universal.name]: `^${universal.version}`,
  [web.name]: `^${web.version}`,
})

console.log(`Current Version: ${main.version}`)
console.log(`  Updating @skypager/web to ${web.version}`)
console.log(`  Updating @skypager/runtime to ${universal.version}`)
console.log(`  Updating @skypager/node to ${node.version}`)
console.log(`  Updating @skypager/cli to ${cli.version}`)

fs.writeFileSync(
  path.resolve(__dirname, '..', 'package.json'),
  JSON.stringify(updatedPackage, null, 2)
)
