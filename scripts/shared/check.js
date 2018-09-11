const { resolve } = require('path')
const { execSync } = require('child_process')

module.exports = Object.assign(check, { verifyNpmLogin, verifyLocalBuilds })

async function check(options = {}) {
  const runtime = require('@skypager/node')
  const { print, colors, icon } = runtime.cli
  const { npm = true, builds = true } = options
  const npmUser = await verifyNpmLogin(npm)

  if (!npmUser) {
    print([
      icon('explosion'),
      colors.red(`ERROR: A Valid NPM Login is required.`),
      icon('explosion'),
    ])
    print(`Login to npm using the following command:`)
    print(`$ npm login`, 4, 2, 2)
    process.exit(1)
  }

  const { needsBuild } = await verifyLocalBuilds(builds)

  if (builds && needsBuild.length) {
    print([
      icon('explosion'),
      colors.red(`ERROR: Missing local dependency builds`),
      icon('explosion'),
    ])
    print(`Your local @skypager dependencies need to be built.  Please run the following command:`)
    print(`$ yarn postinstall`, 4, 2, 2)
    process.exit(1)
  }
}

async function verifyNpmLogin() {
  try {
    return execSync('npm whoami --registry https://registry.npmjs.org', {
      cwd: process.cwd(),
    })
      .toString()
      .trim()
  } catch (error) {
    return false
  }
}

async function verifyLocalBuilds(required = true) {
  const stageOne = [['@skypager/runtime', 'src/runtime', 'lib']]

  const stageTwo = [
    ['@skypager/node', 'src/runtimes/node', 'lib'],
    ['@skypager/features-file-manager', 'src/features-file-manager', 'lib'],
  ]

  if (required === false && !runtime.argv.force) {
    return { first: [], rest: [], stageOne, stageTwo, needsBuild: [] }
  }

  const needsBuilding = list =>
    list.filter(entry => !skypager.fsx.existsSync(resolve(__dirname, '..', entry[1], entry[2])))

  const first = runtime.argv.force ? stageOne : needsBuilding(stageOne)
  const rest = runtime.argv.force ? stageTwo : needsBuilding(stageTwo)

  return { first, rest, stageOne, stageTwo, needsBuild: first.concat(rest) }
}
