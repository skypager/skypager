const runtime = require('@skypager/node').use(require('@skypager/portfolio-manager'))
const express = require('express')
const { Server } = require('@skypager/helpers-server')

class PortfolioServer extends Server {
  get cors() {
    return true
  }

  get history() {
    return false
  }

  get serveStatic() {
    return false
  }

  displayBanner() {}
  async appDidMount(app) {
    this.portfolio = runtime.feature('portfolio-manager')

    await this.portfolio.enable()
    await this.portfolio.whenReady()
    await this.portfolio.packageManager.checkRemoteStatus()

    app.get('/version-map', (req, res) => {
      res.json(this.portfolio.packageManager.versionMap)
    })

    app.get('/latest-map', (req, res) => {
      res.json(this.portfolio.packageManager.latestMap)
    })

    app.use(express.static(this.runtime.resolve('build')))

    return app
  }
}

runtime.servers.register('portfolio', () => PortfolioServer)

async function main() {
  console.log(runtime.servers.available)
  const server = runtime.server('portfolio')
  console.log(server.provider)
  await server.start()

  if (runtime.argv.interactive) {
    runtime.repl('interactive').launch({ server, portfolio: runtime.portfolio })
  }
}

main()
