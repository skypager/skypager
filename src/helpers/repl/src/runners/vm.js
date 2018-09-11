export function run(command, context, filename, callback) {
  let result
  const { runtime, repl } = this
  const script = runtime.vm.createScript(command, { filename })

  try {
    result = script.runInContext(context)
  } catch (error) {
    if (isRecoverable(error)) {
      return callback(new repl.Recoverable(error))
    } else {
      return callback(error)
    }
  }

  callback(null, result)
}

function isRecoverable(error) {
  if (error.name === "SyntaxError") {
    return /(Unexpected end of input|Unexpected Token)/.test(error.message)
  }

  return false
}
