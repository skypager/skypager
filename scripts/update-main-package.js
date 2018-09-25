if (process.env.CI || process.env.JOB_NAME) {
  // we only need to do this on the developer machines right now
  // until we're publishing from CI
  process.exit(0)
}

const fs = require('fs')
const path = require('path')

const web = require('../src/runtimes/web/package.json')
const universal = require('../src/runtime/package.json')
const node = require('../src/runtimes/node/package.json')
const cli = require('../src/devtools/cli/package.json')
const main = require('../src/main/package.json')
const mainDistPath = path.resolve(__dirname, '..', 'src', 'main', 'dist')

console.log(`Current Version: ${main.version}`)
console.log(`Updating @skypager/web to ${web.version}`)
console.log(`Updating @skypager/runtime to ${universal.version}`)
console.log(`Updating @skypager/node to ${node.version}`)
console.log(`Updating @skypager/cli to ${cli.version}`)

if (!fs.existsSync(mainDistPath)) {
  fs.mkdirSync(mainDistPath)
}

fs.copyFileSync(
  path.resolve(__dirname, '..', 'src', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.min.js'),
  path.resolve(mainDistPath, 'skypager-runtimes-web.min.js')
)

const updatedPackage = Object.assign({}, main)

updatedPackage.dependencies = Object.assign({}, updatedPackage.dependencies, {
  [cli.name]: `^${cli.version}`,
  [node.name]: `^${node.version}`,
  [universal.name]: `^${universal.version}`,
  [web.name]: `^${web.version}`,
})

fs.writeFileSync(
  path.resolve(mainDistPath, '..', 'package.json'),
  JSON.stringify(updatedPackage, null, 2)
)
