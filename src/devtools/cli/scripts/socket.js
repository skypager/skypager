const runtime = require('@skypager/node')
const { randomBanner, print } = runtime.cli

async function main() {
  const { handler, script, socketName = runtime.argv.name } = runtime.argv

  runtime
    .feature('socket', {
      ...(socketName && { socketName }),
    })
    .enable()

  const { socket } = runtime

  const command = runtime.argv._[0] || 'help'

  if (command === 'help' || runtime.argv.help) {
    displayHelp()
    process.exit(0)
  }

  if (command === 'stop') {
    await runtime.fsx.removeAsync(socket.socketPath)
  } else if (command === 'start') {
    if (socket.socketExists && !runtime.argv.restart) {
      print(`A socket is already listening at this path: ${socket.socketPath}`)
      print(`Run the following to stop it:`)
      print(`$ skypager socket stop`, 4)
      process.exit(1)
    } else if (socket.socketExists && runtime.argv.restart) {
      await socket.removeLock()
    }

    randomBanner('Skypager', { font: 'Slant' })
    print(`Starting Socket Server`)
    print(`Socket Path: ${runtime.relative(socket.socketPath)}`, 4)

    await socket.listen()

    socket.enableStatusChecks({
      statusCheck: true,
    })

    if (!runtime.argv.silent) {
      socket.on('ping', data => {
        print(`ping. version: ${data.stateVersion} time: ${data.time}`)
      })
    }

    print(`The socket server is listening.`)

    if (script) {
      print(`Runing socket server setup script`)
      print(`Script path: ${script}`, 4)
      await socket.runSetupScript(script)
    }
  }
}

function displayHelp() {
  randomBanner('Skypager')
  print(`skypager IPC socket server`)
  console.log(
    `
  Usage:
  
    $ skypager socket start
    $ skypager socket stop

  Options:
    --script <path>
    --socket-name <name>          the name of the socket file, 
                                  will use the current package name as a default
    --socket-path <path>          the path to the socket file, 
                                  will use tmp/$socketName.sock by default
    --restart                     replace the existing socket if it already exists
    --ping-interval <interval>    an interval to send ping messages to connect clients. default is 30 * 1000 milliseconds
  `.trim()
  )
}

main()
