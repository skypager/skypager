import { write, openSync, closeSync, statSync, readFileSync } from "fs"

export default (repl, file) => {
  try {
    const stat = statSync(file) // eslint-disable-line
    repl.rli.history = readFileSync(file, "utf-8").split("\n").reverse()
    repl.rli.history.shift()
    repl.rli.historyIndex = 0
  } catch (e) {}

  const fd = openSync(file, "a")

  repl.rli.addListener("line", function(code) {
    if (code && code !== ".history") {
      write(fd, `${code}\n`, function() {})
    } else {
      repl.rli.historyIndex++
      repl.rli.history.pop()
    }
  })

  process.on("exit", function() {
    closeSync(fd)
  })

  repl.commands[".history"] = {
    help: "Show the history",
    action() {
      const out = []
      repl.rli.history.forEach(v => {
        out.push(v)
      })
      repl.outputStream.write(`${out.reverse().join("\n")}\n`, function(err) {})
      repl.displayPrompt()
    },
  }

  return repl
}
