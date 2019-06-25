const runtime = require('@skypager/node')
const MultiSpinner = require('multispinner')

const { icon, colors, print } = runtime.cli

const { red, green } = colors

const { spawn } = runtime.proc.async
const { fileManager, packageManager } = runtime
const { flatten, padEnd, padStart, max, uniq } = runtime.lodash

runtime.feature('profiler').enable()

const colorNames = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'red', 'white'].map(name => str =>
  colors[name](str)
)

let usedIndex = Math.ceil(Math.random() * colorNames.length)
let colorMap = {}

const changedPackages = []

const randomColor = string => {
  if (usedIndex >= colorNames.length) {
    usedIndex = 0
  }

  const colorFn = (colorMap[string] = colorMap[string] || colorNames[usedIndex])
  const result = colorFn(string)
  usedIndex = usedIndex + 1

  return result
}

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
  const requestedHelp = runtime.argv.help || runtime.argv._[0] === 'help'

  if (requestedHelp) {
    displayHelp()
  } else {
    return handler()
  }
}

function displayHelp() {
  const { colors, randomBanner, print } = runtime.cli

  randomBanner('Skypager')
  print(colors.bold.underline(`Skypager Script Runner`), 0, 0, 1)
  console.log(
    `
    Use to spawn multiple scripts in a single project, or in multiple projects in a monorepo.

    With run-all you can spawn scripts sequentially, in parallel, and control the output of these
    processes in different ways.  
    
    You can hide their output behind a spinner, if using a TTY, or stream their output with a prefix in CI.
    `.trim()
  )
}

async function handler() {
  const { profiler } = runtime

  profiler.profileStart('runAll')
  await fileManager.startAsync({ startPackageManager: true })

  if (onlyChanged) {
    const { normalOutput = [] } = await runtime.proc.spawnAndCapture({
      cmd: 'lerna',
      args: ['updated', '--json'],
      cwd: runtime.gitInfo.root,
    })

    const json = normalOutput.join('')

    const changed = JSON.parse(json)
    changedPackages.push(...changed.map(c => c.name).filter(v => v && v.length))
  }

  const { assignments = [], failures = [] } = await handleAssignments(buildAssignments()).then(
    r => r || {}
  )

  profiler.profileEnd('runAll')

  print(`Finished ${assignments.length} tasks in ${profiler.report.runAll.duration} ms`)

  if (failures.length) {
    print(
      `${icon('boom')} ${colors.red(failures.length.toString())} projects ${colors.red('FAILED')}`
    )
    print(failures.map(({ label, error }) => `${label}| ${error.message}`))
    process.exit(1)
  }
}

// eslint-disable-next-line
const sleep = (ms = 400) => new Promise(res => setTimeout(res, ms))

function buildAssignments() {
  const tasks = flatten(commands.map(parseItem))

  const assignments = tasks
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
    .filter(({ name, label, cwd }) => {
      // if we only want to touch changed packages, and this package hasn't changed, we will just not run anything
      if (onlyChanged) {
        const isChanged = changedPackages.indexOf(name) > -1

        if (!isChanged) {
          print(`${label}| ${colors.yellow('SKIPPING')}. Project has not changed.`)
        }

        return isChanged
      } else {
        return true
      }
    })

  const uniqueProjects = uniq(assignments.map(p => p.name))
  const multipleProjects = uniqueProjects.length > 1
  const maxLabelLength = max(
    assignments.map(({ task, name }) =>
      multipleProjects ? name.length : task.split(' ')[0].length
    )
  )

  const multiLabel = ({ task, name }) => `${randomColor(padEnd(name, maxLabelLength))} ${task}`
  const singleLabel = ({ task }) => randomColor(padStart(task, maxLabelLength))

  return assignments.map(assignment => ({
    ...assignment,
    label: multipleProjects ? multiLabel(assignment) : singleLabel(assignment),
  }))
}

async function handleAssignments(assignments) {
  const failures = []

  if (sequential) {
    for (let assignment of assignments) {
      banner(assignment)
      await run(assignment).catch(error => failures.push({ ...assignment, error }))
    }

    return {
      assignments,
      failures,
    }
  }

  const spinner = createSpinner(uniq(assignments.map(p => p.label || p.name)))

  progress && spinner.start()

  await Promise.all(
    assignments.map(item => {
      return run(item)
        .then(() => {
          if (progress) {
            spinner.success(item.label || item.name)
          }
        })
        .catch(error => {
          if (progress) {
            spinner.error(item.label || item.name)
          }
          failures.push({
            ...item,
            error,
          })
        })
    })
  )

  await sleep(300)

  return {
    failures,
    assignments,
  }
}

async function run(
  { cwd, task, name, runner, label = name, labelLength = label.length },
  options = {}
) {
  const ARGS = runtime.argv.args || process.env.RUNTIME_ARGS || ''
  const job = spawn(runner, [task].concat(ARGS.split(' ')), {
    cwd,
    ...options,
  })

  const { childProcess } = job

  const errorOutput = []
  const normalOutput = []

  const taskPrefix = `${padStart(`${label}`, labelLength)}|`

  childProcess.stderr.on('data', buf => {
    const content = buf.toString()

    errorOutput.push(content)

    if (!progress) {
      if (prefix) {
        print(content.split('\n').map(chunk => `${taskPrefix}  ${chunk}`))
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
        print(content.split('\n').map(chunk => `${taskPrefix}  ${chunk}`))
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
