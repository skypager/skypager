const run = require('./shared/run')

run(
  async runtime => {
    await runtime.fileManager.startAsync()
    await runtime.packageManager.startAsync()
    await runtime
      .repl('interactive')
      .launch(Object.assign({}, runtime.lodash.omit(runtime.lodash, '_'), { runtime }))
  },
  { exit: false }
)
