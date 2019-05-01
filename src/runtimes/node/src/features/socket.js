import { Feature } from '@skypager/runtime'
import IPC from 'crocket'
import Qbus from '@skypager/runtime/lib/utils/qbus'

const servers = new Map()

export default class Socket extends Feature {
  static shortcut = 'socket'
  static isObservable = true

  initialState = {
    listening: false,
    connected: false,
  }

  get status() {
    const { isFunction } = this.lodash
    const { status } = this.featureSettings || this.options

    const { stateVersion, currentState } = this
    const { cwd } = this.runtime
    const { name, version } = this.runtime.currentPackage

    const base = {
      name,
      version,
      cwd,
      pid: process.pid,
      currentState,
      stateVersion,
      time: Date.now(),
    }

    return isFunction(status) ? status.call(this, base) : base
  }

  unsubscribe(channel, fn) {
    this.ipc.off(channel, fn)
    return this
  }

  subscribe(channel, fn) {
    this.ipc.on(channel, fn)
    return this
  }

  subscribeOnce(channel, fn) {
    this.once(`/message/${channel}`, fn)

    function temp(...args) {
      this.emit(`/message/${channel}`, ...args)
      this.ipc.off(channel, temp)
    }

    this.ipc.on(channel, temp)

    return this
  }

  ask(channel, payload, replyChannel = channel) {
    return new Promise((resolve, reject) => {
      this.subscribeOnce(replyChannel, resp => {
        resolve(resp)
      })

      this.publish(channel, payload)
    })
  }

  publish(channel, payload) {
    this.ipc.emit(channel, payload)
    return this
  }

  async connect({ path = this.socketPath } = {}) {
    if (!this.runtime.fsx.existsSync(path)) {
      const error = new Error(`No socket exists at: ${path}`)
      this.emit('error', error)
      throw error
    }

    return new Promise((resolve, reject) => {
      this.ipc.connect({ path }, err => (err ? reject(err) : resolve(this)))
    }).then(ipc => {
      this.emit('connected', this.ipc)
      this.state.set('connected', true)
      return this
    })
  }

  close() {
    return this.stop()
  }

  async stop() {
    clearInterval(this._pingInterval)
    this.ipc.close()
    this.state.merge({ listening: false })
    return this
  }

  async removeLock() {
    await this.runtime.fsx.removeAsync(this.socketPath).catch(error => error)
  }

  enableStatusChecks(metadata = {}) {
    if (this.currentState.statusChecksEnabled) {
      return this
    }

    const statusHandler = payload => this.ping({ ...payload, ...metadata })

    this.subscribe('/check-status', statusHandler)

    this.state.set('statusChecksEnabled', true)

    return () => this.unsubscribe('/check-status', statusHandler)
  }

  trackErrors(options = {}) {
    const { max = 5 } = options
    this.ipc.on('error', error => {
      const errors = this.state.get('errors') || []
      const errorCount = this.state.get('errorCount') || 0

      errors.push(error)

      this.state.set('errors', errors.reverse().slice(0, max))
      this.state.set('errorCount', errorCount + 1)
    })
  }

  async runSetupScript(scriptPath, handler) {
    const scriptExists = await this.runtime.fsx.existsAsync(scriptPath)

    if (!scriptExists) {
      const resolvable = await this.runtime.packageFinder.attemptResolve(scriptPath)

      if (resolvable) {
        scriptPath = resolvable
      }

      if (!scriptPath) {
        throw new Error(`Could not find socket setup script: ${scriptPath}`)
      }
    }

    const mod = require(this.runtime.resolve(scriptPath))
    const fn = handler ? mod[handler] : mod.default ? mod.default : mod

    if (typeof fn === 'undefined') {
      const handlerMessage = handler
        ? `Looked for the ${handler} named export and could not find it.`
        : `Looked on the default export and module.exports and could not find a function`

      throw new Error(`Could not find socket setup script.${handlerMessage}`)
    }

    const response = await fn(this, this.runtime)

    return response
  }

  async ping(metadata = {}) {
    const update = {
      ...metadata,
      ...this.status,
    }

    this.emit('ping', update)
    this.publish('/ping', update)
  }

  async listen({
    pingInterval = 30 * 1000,
    path = this.socketPath,
    removeLock = this.runtime.argv.removeLock,
  } = {}) {
    if (this.socketExists && !removeLock) {
      throw new Error(`Socket already exists: ${path}`)
    }

    if (removeLock) {
      await this.removeLock()
    }

    await this.runtime.fsx.mkdirpAsync(this.runtime.pathUtils.dirname(path))

    process.on('exit', () => this.runtime.fsx.removeSync(path))

    this._pingInterval = setInterval(() => {
      try {
        this.ping()
      } catch (error) {}
    }, pingInterval)

    return new Promise((resolve, reject) => {
      this.ipc.listen({ path }, err => (err ? reject(err) : resolve(this)))
    }).then(me => {
      this.state.merge({ listening: true })
      this.emit('listening', path)
      return me
    })
  }

  get socketExists() {
    return this.runtime.fsx.existsSync(this.socketPath)
  }

  get serverId() {
    return this.runtime.hashObject({
      cwd: this.runtime.cwd,
      socketPath: this.socketPath,
    })
  }

  get ipc() {
    const server = servers.get(this.serverId)

    if (server) {
      return server
    }

    const ipcServer = new IPC()

    ipcServer.use(Qbus)

    servers.set(this.serverId, ipcServer)

    return ipcServer
  }

  get socketPath() {
    const { socketName = this.runtime.currentPackage.name } = this.featureSettings || this.options
    const { runtime } = this
    const { isEmpty } = this.lodash

    const { socketPath } = this.featureSettings || this.options

    if (socketPath) {
      return socketPath
    }

    const rootPath = isEmpty(runtime.gitInfo.root) ? runtime.cwd : runtime.gitInfo.root

    return this.runtime.resolve(rootPath, 'tmp', `${socketName.replace(/\/|\\/g, '-')}.sock`)
  }
}
