const runtime = require('@skypager/node')
const MultiSpinner = require('multispinner')

const { colors, print } = runtime.cli

const { red, green } = colors

const { spawn } = runtime.proc.async
const { fileManager, packageManager } = runtime

/**
 * @usage
 *
 * # build all of the helpers and all of the apps
 * $ skypager run-all 'helpers/*' 'apps/*'
 */
const { _: commands = [] } = runtime.argv

const {
  /**
   * --ci or auto-detects based on common environment variables
   * @type {boolean}
   */
  isCI = runtime.argv.ci || process.env.CI || (process.env.JOB_NAME && process.env.BRANCH_NAME),
  /**
   * --seq or --sequential
   * Whether you want to run the commands one at a time.  Default is to run them in parallel
   *
   * @type {boolean}
   */
  sequential = !!runtime.argv.seq,

  /**
   * --prefix
   *
   * Prefix the package name in the stdout.  Default is true
   *
   * @type {boolean}
   */
  prefix = true,

  /**
   * --progress
   *
   * Instead of displaying output, just display the spinners
   *
   * @type {boolean}
   */
  progress = false,

  /**
   * --only-changed
   *
   * Only run the command if the package has changed since the last commit
   *
   * @type {boolean}
   */
  onlyChanged = false,

  /**
   * Which package scope? defaults to one found in the name of the current package
   */
  scope = runtime.currentPackage.name.split('/')[0],
} = runtime.argv

/**
 * @param {string} command -  the id of an npm package task in the mono repo that you want to run.
 *                            any of the following are valid
 *
 *                              - @scope/:projectName/:packageTask        this will run a task in a nested project
 *                              - :projectName/:packageTask               this will run a task in a nested project, the package scope and initial slash can be omitted (e.g. runtime/build or helpers-client/build)
 *                              - :packageTask                            this will run a task in the top level project
 *
 *
 * @returns {{ projectName: string, task: string }}
 */
const parseItem = command => {
  // run a top level task
  if (command.indexOf('/') === -1) {
    return {
      projectName: runtime.currentPackage.name,
      task: command,
    }
  }

  let parts = command.split('/')

  // they included the scope
  if (parts.length === 3) {
    parts = parts.slice(1)
  }

  if (parts[0].match(/\*/)) {
    const pattern = new RegExp(parts[0].replace(/\*/g, '.*'))
    const matchingProjects = packageManager.packageNames.filter(
      name =>
        name.match(runtime.currentPackage.name.split('/')[0].replace(/\W+/, '')) &&
        name.match(pattern)
    )

    return matchingProjects.map(projectName => ({
      projectName,
      task: parts[1],
    }))
  }

  return {
    projectName: `${scope}/${parts[0]}`,
    task: parts[1],
  }
}

async function main() {
  await fileManager.startAsync({ startPackageManager: true })

  await handleAssignments(buildAssignments())
}

// eslint-disable-next-line
const sleep = (ms = 400) => new Promise(res => setTimeout(res, ms))

function buildAssignments() {
  const tasks = runtime.lodash.flatten(commands.map(parseItem))

  return tasks
    .map(({ projectName, task }) => {
      const project = packageManager.findByName(projectName)

      if (!project) {
        console.log({ projectName, task })
        return false
      }

      const { scripts = {} } = project

      if (scripts[task]) {
        return {
          runner: 'yarn',
          cwd: project._file.dir,
          name: project.name,
          task,
        }
      } else {
        return {
          runner: 'skypager',
          cwd: project._file.dir,
          name: project.name,
          task,
        }
      }
    })
    .filter(Boolean)
    .filter(({ name, cwd }) => {
      // if we only want to touch changed packages, and this package hasn't changed, we will just not run anything
      if (onlyChanged) {
        // TODO
        return true
      } else {
        return true
      }
    })
}
async function handleAssignments(assignments) {
  if (sequential) {
    for (let assignment of assignments) {
      banner(assignment)
      await run(assignment)
    }

    return
  }

  const spinner = createSpinner(assignments.map(p => p.name))

  progress && spinner.start()

  const failures = []

  await Promise.all(
    assignments.map(item => {
      return run(item)
        .then(() => {
          progress && spinner.success(item.name)
        })
        .catch(error => {
          progress && spinner.error(item.name)
        })
    })
  )

  await sleep(300)

  if (failures.length) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

async function run({ cwd, task, name, runner }, options = {}) {
  const job = spawn(runner, [task], {
    cwd,
    ...options,
  })

  const { childProcess } = job

  const errorOutput = []
  const normalOutput = []

  childProcess.stderr.on('data', buf => {
    const content = buf.toString()

    errorOutput.push(content)

    if (!progress) {
      if (prefix) {
        print(content.split('\n').map(chunk => `[${name}]: ${chunk}`))
      } else {
        print(content)
      }
    }
  })

  childProcess.stdout.on('data', buf => {
    const content = buf.toString()

    normalOutput.push(content)

    if (!progress) {
      if (prefix) {
        print(content.split('\n').map(chunk => `[${name}]: ${chunk}`))
      } else {
        print(content)
      }
    }
  })

  try {
    await job

    return { errorOutput, normalOutput, childProcess, options: { task, name, cwd, runner } }
  } catch (error) {
    const e = new Error(`${runner} ${task} failed in ${name}`)

    e.cwd = cwd
    e.childProcess = childProcess
    e.errorOutput = errorOutput
    e.normalOutput = normalOutput
    e.original = error
    e.options = { task, name, cwd, runner }

    throw e
  }
}

function banner({ runner, name, cwd, task }) {
  print(`Running ${runner} ${task} in ${name}`)
}

main()

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

const createSpinner = (names = [], ciMode = isCI) =>
  ciMode ? new CISpinner(names) : new MultiSpinner(names, { autoStart: false, clear: false })
