const PROC_MAX_BUFFER = process.env.SKYPAGER_PROC_MAX_BUFFER || 1024 * 1024

export default (async function processOutput(chain, options = {}) {
  if (typeof options === 'string') {
    options = { command: options }
  }

  const { command = options.cmd, cwd = this.cwd, environment = this.environment } = options
  const { exec } = this.proc.async
  const { defaults } = this.lodash

  const catchFailure = error => {
    options.catchFailure
      ? options.catchFailure.call(this, error, options)
      : (error => ({ stderr: `${error.message}\n\n\n${error.stack}`, stdout: `` }))(error)
  }

  const result = await exec(command, {
    cwd,
    env: defaults({}, environment, process.env),
    maxBuffer: this.argv.maxProcBuffer || PROC_MAX_BUFFER,
    ...options,
  }).catch(error => {
    console.error(`Error while running process/result`, { error: error.message, command, cwd })
    return catchFailure(error)
  })

  const {
    stdout,
    stderr,
    childProcess: { exitCode, spawnArgs, pid },
  } = result || {
    stdout: '',
    stderr: '',
    childProcess: { exitCode: 1, spawnArgs: command.split(' ').slice(1), pid: null },
  }

  return chain.plant({
    exitCode,
    spawnArgs,
    pid,
    stdout: stdout.toString(),
    stderr: stderr.toString(),
  })
})
