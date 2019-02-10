const runtime = require('@skypager/node')
  .use(require('..'))
  .use(require('@skypager/helpers-server'))

const { randomBanner, clear, print } = runtime.cli

async function main() {
  const server = runtime.server('file-manager', {
    fileManager: () => {
      const fm = runtime.fileManager
      return fm
    },
    showBanner: false,
  })

  await server.start()

  // runtime.repl('interactive').launch({ runtime, server, fileManager: runtime.fileManager })
}

main()
