const runtime = require('@skypager/node')
const { randomBanner, print } = runtime.cli

const MAX_MESSAGE_LENGTH = 4 * 1000

async function main() {
  const { enableVm, handler, script, socketName = runtime.argv.name } = runtime.argv

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

    if (enableVm) {
      socket.subscribe(
        '/vm/run-code',
        ({ code, messageId, taskId = messageId || runtime.hashObject({ code }), ...options }) => {
          const replyChannel =
            options.replyChannel || `/vm/run-code/response/${taskId.replace(/\W/g, '')}`

          runCode({ ...options, messageId: messageId || taskId, socket, code })
            .then(({ cacheKey, integrity }) => {
              return socket.publish(replyChannel, { cacheKey, integrity, error: false })
            })
            .catch(error => {
              socket.publish(replyChannel, { result: error, error: true })
            })
        }
      )
    }
  } else if (command === 'run') {
    const script = runtime.argv._[1] || runtime.argv.script

    if (!script) {
      print(`Error must provide a script`)
      process.exit(1)
    }

    const scriptPath = runtime.resolve(script)
    const scriptContent = await runtime.fsx.readFileAsync(scriptPath).then(buf => buf.toString())

    await socket.connect()

    const messageId = runtime.hashObject({ cwd: runtime.cwd, scriptPath, scriptContent })

    if (runtime.argv.term) {
      socket.subscribe(`/socket-run/console/:messageId`, (messageId, e) => {
        const { fn, args = [] } = e
        console[fn](...args)
      })
    }

    socket.subscribe(`/vm/run-code/response/${messageId}`, res => {
      const { integrity } = res
      runtime.fileManager.cache.get
        .byDigest(integrity)
        .then(buf => {
          if (runtime.argv.pretty) {
            try {
              console.log(JSON.stringify(JSON.parse(buf.toString()), null, 2))
            } catch (error) {
              console.log(buf.toString())
            }
          } else {
            console.log(buf.toString())
          }
        })
        .then(() => {
          socket.close()
          process.exit(0)
        })
        .catch(e => process.exit(0))
    })

    socket.publish(`/vm/run-code`, {
      messageId,
      scriptPath,
      ...runtime.argv,
      ...(scriptContent.length < MAX_MESSAGE_LENGTH && { code: scriptContent }),
    })
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

async function runCode(options = {}) {
  let { code = '' } = options
  const { socket, refresh = false, scriptPath, term, messageId } = options

  const cacheKey = runtime.hashObject({
    code,
    ...(refresh && { cacheBuster: Math.random() }),
    scriptPath,
    term,
  })

  if (scriptPath && (!code || !code.length)) {
    const scriptExists = await runtime.fsx.existsAsync(scriptPath)

    if (!scriptExists) {
      throw new Error(`Could not find script at ${scriptPath}`)
    }

    code = await runtime.fsx.readFileAsync(scriptPath).then(buf => buf.toString())
  }

  const inCache = await runtime.fileManager.cache.get(cacheKey).catch(e => false)

  if (inCache) {
    runtime.debug('portfolio socket vm cache hit', {
      cacheKey,
      integrity: inCache.integrity,
      code,
    })

    return {
      cacheKey,
      integrity: inCache.integrity,
    }
  } else {
    runtime.debug('portfolio socket vm cache miss', {
      cacheKey,
      code,
    })

    let response

    const context = options.context || {}

    if (term) {
      context.console = runtime.scriptRunner.mockConsole({}, (...args) => {
        const fn = args.shift()
        socket.publish(`/socket-run/console/${messageId}`, {
          fn,
          args,
        })
      })
    }

    response = await runtime.scriptRunner.runCode({
      ...options,
      messageId,
      code,
      context,
    })

    const result = runtime.lodash.cloneDeep(response.result)
    const integrity = await runtime.fileManager.cache.put(cacheKey, JSON.stringify(result))
    return { cacheKey, integrity }
  }
}
