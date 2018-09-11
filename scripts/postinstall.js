const MultiSpinner = require('multispinner')
const { resolve } = require('path')
const skypager = require('@skypager/node')
const { spawn } = skypager.proc.async
const { spawnSync } = skypager.proc
const { randomBanner, print, clear } = skypager.cli
const { red, dim, blue, magenta, green } = skypager.cli.colors

const stageOne = [['@skypager/runtime', 'src/runtime', 'lib']]

const stageTwo = [
  ['@skypager/node', 'src/runtimes/node', 'lib'],
  ['@skypager/features-file-manager', 'src/features-file-manager', 'lib'],
]

const first = stageOne
const rest = stageTwo

clear()

class CISpinner {
  constructor(projectNames) {
    this.projectNames = projectNames
  }

  start() {
    console.log('Starting Build Scripts')
    this.projectNames.forEach(name => console.log(`  ${name}`))
  }
  success(name) {
    console.log(`${green('Success')}: ${name}`)
  }
  error(name) {
    console.log(`${red('ERROR')}: ${name}`)
  }
}

async function main() {
  console.log('Building Local Projects')

  if (!first.length && !rest.length) {
    return
  }

  const spinner = process.env.JOB_NAME
    ? new CISpinner(first.concat(rest).map(i => i[0]))
    : new MultiSpinner(first.concat(rest).map(i => i[0]), {
        autoStart: false,
        clear: false,
      })

  spinner.start()

  await Promise.all(
    first.map(([project, subfolder]) =>
      spawn('yarn', ['build'], { cwd: skypager.resolve(subfolder) })
        .then(() => {
          spinner.success(project)
        })
        .catch(error => {
          print(red(`Error in ${project}`))
          print(red(error.message), 2, 2, 2)
          print(red(error.stack), 2, 2, 2)
          spinner.error(project)
          throw error
        })
    )
  ).catch(error => {
    process.exit(1)
  })

  await Promise.all(
    rest.map(([project, subfolder]) =>
      spawn('yarn', ['build', skypager.argv.force && '--force'].filter(Boolean), {
        cwd: skypager.resolve(subfolder),
        stdio: skypager.argv.debug ? 'inherit' : 'ignore',
      })
        .then(() => {
          spinner.success(project)
        })
        .catch(error => {
          print(red(`Error in ${project}`))
          print(red(error.message), 2, 2, 2)
          print(red(error.stack), 2, 2, 2)
          spinner.error(project)
          throw error
        })
    )
  ).catch(error => {
    process.exit(1)
  })

  return new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
}

main()
  .then(() => {
    print('Creating dev dependency symlinks in each of our local projects.')
    return spawn('yarn', ['link:devDependencies'], {
      stdio: 'ignore',
    })
  })
  .then(() => {
    printUsageInstructions()
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

function printUsageInstructions() {
  clear()
  randomBanner('Skypager')

  print([`The Skypager Frontend Portfolio`, `Version: ${skypager.currentPackage.version}`], 0, 2, 2)

  spawnSync('lerna', ['ls'], {
    cwd: resolve(__dirname, '..'),
    stdio: 'inherit',
  })

  console.log(`\n\n${USAGE}\n\n`)
}

const USAGE = `
${green.bold('Good luck!')}
`.trim()
