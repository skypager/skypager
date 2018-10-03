require('@babel/register')({
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        targets: {
          node: '6.11.1',
        },
      },
    ],
  ],
  plugins: ['@babel/plugin-proposal-object-rest-spread', '@babel/plugin-transform-runtime'],
})

const { resolve } = require('path')
const MultiSpinner = require('multispinner')
const { spawn } = require('child-process-promise')
const { red, green } = require('chalk')
const { spawnSync } = require('child_process')
const ARGV = require('minimist')(process.argv.slice(0, 2))
const currentPackage = require('../package.json')

const cwd = resolve(__dirname, '..')

try {
  console.log('@skypager/runtime versions:')
  console.log('Local Version: ' + require('../src/runtime/package.json').version)
  console.log('Node Modules Version: ' + require('@skypager/runtime/package.json').version)
} catch (error) {}

process.env.DISABLE_SKYPAGER_FILE_MANAGER = true

const stageOne = [
  ['@skypager/features-file-manager', 'src/features/file-manager', 'lib'],
  ['@skypager/node', 'src/runtimes/node', 'lib'],
]

const stageTwo = [
  ['@skypager/helpers-client', 'src/helpers/client', 'lib'],
  ['@skypager/helpers-server', 'src/helpers/server', 'lib'],
  ['@skypager/helpers-repl', 'src/helpers/repl', 'lib'],
  ['@skypager/helpers-sheet', 'src/helpers/sheet', 'lib'],
]

const first = stageOne
const rest = stageTwo

class CISpinner {
  constructor(projectNames) {
    this.projectNames = projectNames
  }

  start() {
    print('Starting Build Scripts')
    this.projectNames.forEach(name => print(`  ${name}`))
  }
  success(name) {
    print(`${green('Success')}: ${name}`)
  }
  error(name) {
    print(`${red('ERROR')}: ${name}`)
  }
}

const print = message => console.log(message)

async function main() {
  print(`Building @skypager/runtime ${require('../src/runtime/package.json').version}`)

  await spawn('yarn', ['build'], {
    cwd: resolve(__dirname, '..', 'src', 'runtime'),
  })

  if (!first.length && !rest.length) {
    return
  }

  print('Building rest of the projects in stages')
  // skypager.cli.clear()

  const spinner = process.env.JOB_NAME
    ? new CISpinner(first.concat(rest).map(i => i[0]))
    : new MultiSpinner(first.concat(rest).map(i => i[0]), {
        autoStart: false,
        clear: false,
      })

  spinner.start()

  await Promise.all(
    first.map(([project, subfolder]) =>
      spawn('yarn', ['build'], { cwd: resolve(cwd, subfolder), stdio: 'ignore' })
        .then(() => {
          spinner.success(project)
        })
        .catch(error => {
          print(red(`Error in ${project}`))
          print(red(error.message), 2, 2, 2)
          spinner.error(project)
          throw error
        })
    )
  ).catch(error => {
    print(red(error.message))
    print(error.stack)
    process.exit(1)
  })

  await Promise.all(
    rest.map(([project, subfolder]) =>
      spawn('yarn', ['build', ARGV.force && '--force'].filter(Boolean), {
        cwd: resolve(cwd, subfolder),
        stdio: 'ignore',
      })
        .then(() => {
          spinner.success(project)
        })
        .catch(error => {
          print(red(`Error in ${project}`))
          print(red(error.message), 2, 2, 2)
          spinner.error(project)
          throw error
        })
    )
  ).catch(error => {
    print(red(error.message))
    print(error.stack)
    process.exit(1)
  })

  return new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
}

main()
  .then(() => {
    delete process.env.DISABLE_SKYPAGER_FILE_MANAGER
    print('Creating dev dependency symlinks in each of our local projects.')
    return spawn('node', ['scripts/link-dev-dependencies.js'], {
      stdio: 'inherit',
    })
  })
  .then(() => {
    printUsageInstructions()
    process.exit(0)
  })
  .catch(error => {
    print(error)
    process.exit(1)
  })

function printUsageInstructions() {
  print(`The Skypager Frontend Portfolio`, `Version: ${currentPackage.version}`)

  spawnSync('lerna', ['ls'], {
    cwd,
    stdio: 'inherit',
  })

  const USAGE = `
${green.bold('Good luck!')}
`.trim()
  print(`\n\n${USAGE}\n\n`)
}
