export default (repl, evalFn) => {
  const realEval = evalFn || repl.eval

  const promiseEval = (cmd, context, filename, callback) => {
    realEval.call(repl, cmd, context, filename, (err, res) => {
      // Error response
      if (err) {
        return callback(err)
      }

      if (res && typeof res.value === "function" && res.constructor.name === "LodashWrapper") {
        return callback(null, res.value())
      }

      if (
        !res ||
        typeof res.then != "function" ||
        (typeof res.then === "function" && typeof res.context === "object")
      ) {
        return callback(null, res)
      }

      const cancel = (chunk, key) => {
        repl.outputStream.write("break.\n")
        if (key.name === "escape") {
          process.stdin.removeListener("keypress", cancel)
          callback(null, res)
          callback = function() {}
        }
      }

      process.stdin.on("keypress", cancel)

      // Start a timer indicating that escape can be used to quit
      const hangTimer = setTimeout(function() {
        repl.outputStream.write("Hit escape to stop waiting on promise\n")
      }, 5000)

      res
        .then(
          function(val) {
            process.stdin.removeListener("keypress", cancel)
            clearTimeout(hangTimer)
            callback(null, val)
          },
          function(err) {
            process.stdin.removeListener("keypress", cancel)
            clearTimeout(hangTimer)
            repl.outputStream.write("Promise rejected: ")
            callback(err)
          },
        )
        .then(null, function(uncaught) {
          // Rethrow uncaught exceptions
          process.nextTick(function() {
            throw uncaught
          })
        })
    })
  }

  repl.eval = promiseEval

  repl.commands["promise"] = {
    help: "Toggle auto-promise unwrapping",
    action() {
      if (repl.eval === promiseEval) {
        this.outputStream.write("Promise auto-eval disabled\n")
        repl.eval = realEval
      } else {
        this.outputStream.write("Promise auto-eval enabled\n")
        repl.eval = promiseEval
      }
      this.displayPrompt()
    },
  }
}
