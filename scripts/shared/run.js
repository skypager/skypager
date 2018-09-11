const runtime = require('@skypager/node')
const { colors, print } = runtime.cli

const run = async (mainFn, options = {}) => {
  await runtime.start()
  await runtime.mainScript.runMainScript()
  await mainFn(runtime).catch(error => {
    print(colors.red(`FATAL ERROR: ${error.message}`))
    print(error.stack, 8)
    process.exit(1)
  })

  if (options.exit !== false) {
    process.exit(0)
  }
}

const projectTask = async (cwd, task = 'start', args = [], options = {}) => {
  let { runner = 'yarn' } = options

  if (cwd === process.cwd()) {
    runner = 'skypager'
  }

  const result = await runtime.proc.async.spawn(runner, [task, ...args], {
    cwd,
    stdio: 'inherit',
    ...options,
    env: Object.assign({}, process.env, {
      NO_CLEAR: true,
      ...(options.env || {}),
    }),
  })

  return result
}

module.exports = Object.assign(run, { runtime, projectTask })
