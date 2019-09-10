import { hideProperties, hide } from './utils/prop-utils'
import Entity from './Entity'

const OFF = -1
const ERROR = 0
const WARN = 1
const INFO = 2
const DEBUG = 3

const levelsMap = new Map()

levelsMap.set('info', INFO)
levelsMap.set('debug', DEBUG)
levelsMap.set('error', ERROR)
levelsMap.set('errors', ERROR)
levelsMap.set('warn', WARN)
levelsMap.set('warning', WARN)
levelsMap.set('verbose', DEBUG)
levelsMap.set('false', OFF)

/**
 * An observable logger that acts as a centralized logger for the runtime and all helpers.
 */
export class Logger extends Entity {
  /**
   * @param {Object} options
   * @param {Number} [options.retain=0]
   * @param {Boolean} [options.enabled=true]
   * @param {String} [options.prefix='']
   * @param {Console} [options.console=console]
   * @param {String|Number} [options.level=INFO]
   */
  constructor({
    console = global.console,
    retain = 0,
    enabled = true,
    prefix = '',
    level = INFO,
  } = {}) {
    super({ initialState: { retain, enabled, level: levelsMap.get(level) || INFO } })

    this.console = console
    this.prefix = prefix
    this.messages = []

    hide(this, 'prefix', prefix)
    hide(this, 'console', this.console)
    hide(this, 'messages', this.messages)
  }

  /**
   * @param {String|Number|Boolean} level
   */
  enable(level = INFO) {
    if (level === true) {
      level = INFO
    } else if (level === false) {
      return this.disable()
    }

    this.setState({ level: levelsMap.get(level) || level, enabled: true })

    return this
  }

  disable() {
    this.setState({ level: OFF, enabled: false })
    return this
  }

  get level() {
    return this.state.get('enabled') ? this.state.get('level') || INFO : -1
  }

  info(...args) {
    this.emit('info', ...args)
    this.level >= INFO && this.console.info(...fix(this, args))
    return this
  }

  error(...args) {
    this.emit('error', ...args)
    this.level >= ERROR && this.console.error(...fix(this, args))
    return this
  }

  debug(...args) {
    this.emit('debug', ...args)
    this.level >= DEBUG && this.console.debug(...fix(this, args))
    return this
  }

  warn(...args) {
    this.emit('warn', ...args)
    this.level >= WARN && this.console.warn(...fix(this, args))
    return this
  }

  log(...args) {
    return this.info(...args)
  }
}

function fix({ prefix }, args = []) {
  const [first, ...rest] = args

  if (typeof first === 'string' && !first.startsWith(`[${prefix}]`)) {
    return [`[${prefix}]${first}`, ...rest]
  } else {
    return [`[${prefix}]`, first, ...rest]
  }
}

export function attach(entity, console, options = {}) {
  const logger =
    entity.logger ||
    new Logger({
      prefix: entity.name || entity.componentName,
      console,
      ...options,
    })

  hideProperties(entity, {
    logger,
    log: logger.log.bind(logger),
    info: logger.info.bind(logger),
    debug: logger.debug.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
  })
}

export default Logger
