const runtime = require('@skypager/node')
const MultiSpinner = require('multispinner')

const {
  colors: { red, green },
  print,
} = runtime.cli

const { spawn } = runtime.proc.async
const { fileManager, packageManager } = runtime

const { _: commands = [] } = runtime.argv

const {
  isCI = runtime.argv.ci || process.env.CI || (process.env.JOB_NAME && process.env.BRANCH_NAME),
  sequential = runtime.argv.seq,
  prefix = true,
  progress = sequential,
} = runtime.argv

/**
 * @param {string} command -  the id of an npm package task in the mono repo that you want to run.
 *                            any of the following are valid
 *
 *                              - :projectName/:packageTask       this will run a task in a nested project, the package scope and initial slash can be omitted (e.g. @skypager/runtime/build or features-file-manager/build)
 *                              - :packageTask                    this will run a task in the top level project
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
    projectName: `@skypager/${parts[0]}`,
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
}
async function handleAssignments(assignments) {
  if (sequential) {
    for (let assignment of assignments) {
      banner(assignment)
      await run(assignment)
      await sleep(400)
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
        .catch(() => {
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

  childProcess.stdout.on('data', buf => {
    const content = buf.toString()

    if (progress) {
      return
    }

    if (prefix) {
      print(content.split('\n').map(chunk => `[${name}]: ${chunk}`))
    } else {
      print(content)
    }
  })

  try {
    await job
  } catch (error) {}
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
