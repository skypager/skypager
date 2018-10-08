export default (async function processOutput(chain, options = {}) {
  if (typeof options === 'string') {
    options = { command: options }
  }

  const { command = options.cmd, cwd = this.cwd, environment = this.environment } = options
  const { exec } = this.proc.async

  const catchFailure = error => {
    options.catchFailure
      ? options.catchFailure.call(this, error, options)
      : error => ({ stderr: `${error.message}\n\n\n${error.stack}`, stdout: `` })
  }

  const {
    stdout,
    stderr,
    childProcess: { exitCode, spawnArgs, pid },
  } = await exec(command, {
    cwd,
    env: environment,
    ...options,
  }).catch(error => catchFailure(error))

  return chain.plant({
    exitCode,
    spawnArgs,
    pid,
    stdout: stdout.toString(),
    stderr: stderr.toString(),
  })
})
