export const hostMethods = ['lazyLogger', 'getLoggers']

export const featureMethods = ['enableConsoleOutput']

export const shorcut = 'logging'

export function getLoggers() {
  return require('winston').loggers.get('skypager') || require('winston').loggers
}

export function featureWasEnabled() {
  const { runtime } = this
  const { isError } = this.lodash
  const { silent, quiet, verbose } = runtime.argv
  const { commandBase = '' } = runtime

  const requestedSilentMode = !verbose && (quiet || silent) && !commandBase.startsWith('console')

  if (requestedSilentMode) {
    runtime.loggers.remove('console')
  }

  runtime.hide('debug', (...args) => runtime.logger.debug(...args))
  runtime.hide('info', (...args) => runtime.logger.info(...args))

  runtime.hide('error', (...args) => {
    runtime.logger.error(...args.map(arg => (!isError(arg) ? arg : { message: arg.message })))
  })

  runtime.hide('warn', (...args) => runtime.logger.warn(...args))
  runtime.hide('log', (...args) => runtime.logger.info(...args))
}

export function enableConsoleOutput(options = {}) {
  return this.runtime.loggers.add({
    prettyPrint: true,
    colorize: true,
    timestamp: false,
    level: this.argv.verbose ? 'debug' : 'info',
    type: 'console',
    ...options,
  })
}

export function lazyLogger(options = {}) {
  try {
    return _lazyLogger.call(this, options)
  } catch (error) {
    console.log('error building lazy logger', error)
    this.hide('memoryLogger', [])
    this.hide('loggerError', error)
    // wow
    const fn = level => (message, meta = {}) => {
      this.memoryLogger.unshift([level, message, meta])
      this.memoryLogger.length = 100
    }

    return {
      debug: fn('debug'),
      info: fn('info'),
      log: fn('log'),
      error: fn('error'),
      warn: fn('warn'),
    }
  }
}

export function _lazyLogger() {
  let filename = this.get('argv.logFile', process.env.SKYPAGER_LOGFILE)

  if (!filename) {
    this.fsx.mkdirpSync(this.resolve('log'))
    filename = this.resolve('log', `skypager.${this.env}.${this.target}.log`)
  }

  const transports = {
    file: {
      prettyPrint: true,
      colorize: true,
      json: false,
      timestamp: true,
      filename,
      maxSize: '1m',
      type: 'file',
      level:
        this.argv.logLevel ||
        process.env.SKYPAGER_LOG_LEVEL ||
        process.env.LOG_LEVEL ||
        (this.isDevelopment ? 'debug' : 'info'),
    },
    console: {
      prettyPrint: true,
      colorize: true,
      json: false,
      timestamp: false,
      type: 'console',
      level:
        this.argv.logLevel ||
        process.env.SKYPAGER_LOG_LEVEL ||
        process.env.LOG_LEVEL ||
        (this.isDevelopment ? 'debug' : 'info'),
    },
  }

  if (
    process.argv.indexOf('console') > 0 ||
    process.argv.indexOf('--repl') > 0 ||
    process.argv.indexOf('--interactive') > 0
  ) {
    delete transports.console
  }

  require('winston').loggers.add('skypager', transports)

  const logger = require('winston').loggers.get('skypager')

  return logger
}
