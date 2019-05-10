/* eslint-disable max-params, max-statements */

const most = require('most')
const webpack = require('webpack')
const { actions } = require('inspectpack')

const DEFAULT_PORT = 9838
const DEFAULT_HOST = '127.0.0.1'
const ONE_SECOND = 1000
const INSPECTPACK_PROBLEM_ACTIONS = ['duplicates', 'versions']
const INSPECTPACK_PROBLEM_TYPE = 'problems'

function noop() {}

function getTimeMessage(timer) {
  let time = Date.now() - timer

  if (time >= ONE_SECOND) {
    time /= ONE_SECOND
    time = Math.round(time)
    time += 's'
  } else {
    time += 'ms'
  }

  return ` (${time})`
}

// Naive camel-casing.
const camel = str => str.replace(/-([a-z])/, group => group[1].toUpperCase())

// Normalize webpack3 vs. 4 API differences.
function _webpackHook(hookType, compiler, event, callback) {
  if (compiler.hooks) {
    hookType = hookType || 'tap'
    compiler.hooks[camel(event)][hookType]('skypager-socket', callback)
  } else {
    compiler.plugin(event, callback)
  }
}

const webpackHook = _webpackHook.bind(null, 'tap')
const webpackAsyncHook = _webpackHook.bind(null, 'tapAsync')

class SkypagerSocketPlugin {
  constructor(options) {
    if (typeof options === 'function') {
      this.handler = options
    } else {
      options = options || {}
      this.host = options.host || DEFAULT_HOST
      this.port = options.port || DEFAULT_PORT
      this.handler = options.handler || null
    }

    this.cleanup = this.cleanup.bind(this)

    this.runtime = options.runtime || require('@skypager/node')
    this.statsCacheKey =
      options.statsKey ||
      this.runtime.hashObject({
        id: this.runtime.lodash.uniqueId('skypager-webpack-socket'),
        cwd: this.runtime.cwd,
      })

    this.socket = this.runtime.feature('socket', {
      socketName:
        options.name || `webpack-${this.runtime.get('currentPackage.name').replace('/', '-')}`,
    })

    this.watching = false
  }

  cleanup() {
    if (!this.watching && this.socket) {
      this.handler = null
      this.socket.close()
    }
  }

  apply(compiler) {
    let handler = this.handler
    let reachedSuccess = false
    let timer

    if (!handler) {
      handler = noop
      this.socket.listen({ removeLock: true }).then(() => {
        console.log('Skypager Webpack Socket Plugin Listening')
        console.log(this.socket.socketPath)
        handler = (events = [], cb) => {
          this.socket.publish('/webpack/message', {
            events,
          })

          typeof cb === 'function' && cb(null)
        }
      })

      this.socket.subscribe('mode', args => {
        this.minimal = args.minimal
      })

      this.socket.on('error', err => {
        // eslint-disable-next-line no-console
        console.log(err)
      })

      this.socket.on('disconnect', () => {
        if (!reachedSuccess) {
          // eslint-disable-next-line no-console
          console.log('socket disconnected before completing build lifecycle.')
        }
      })
    }

    new webpack.ProgressPlugin((percent, msg) => {
      handler([
        {
          type: 'status',
          value: 'Compiling',
        },
        {
          type: 'progress',
          value: percent,
        },
        {
          type: 'operations',
          value: msg + getTimeMessage(timer),
        },
      ])
    }).apply(compiler)

    webpackAsyncHook(compiler, 'watch-run', (c, done) => {
      this.watching = true
      done()
    })

    webpackAsyncHook(compiler, 'run', (c, done) => {
      this.watching = false
      done()
    })

    webpackHook(compiler, 'compile', () => {
      timer = Date.now()
      handler([
        {
          type: 'status',
          value: 'Compiling',
        },
      ])
    })

    webpackHook(compiler, 'invalid', () => {
      handler([
        {
          type: 'status',
          value: 'Invalidated',
        },
        {
          type: 'progress',
          value: 0,
        },
        {
          type: 'operations',
          value: 'idle',
        },
        {
          type: 'clear',
        },
      ])
    })

    webpackHook(compiler, 'failed', () => {
      handler([
        {
          type: 'status',
          value: 'Failed',
        },
        {
          type: 'operations',
          value: `idle${getTimeMessage(timer)}`,
        },
      ])
    })

    webpackHook(compiler, 'done', stats => {
      const options = stats.compilation.options
      const statsOptions = (options.devServer && options.devServer.stats) ||
        options.stats || { colors: true }

      handler(
        [
          {
            type: 'status',
            value: 'Success',
          },
          {
            type: 'progress',
            value: 1,
          },
          {
            type: 'operations',
            value: `idle${getTimeMessage(timer)}`,
          },
        ],
        () => {
          reachedSuccess = true
        }
      )

      try {
        const statsJsonOptions = {
          source: false,
          colors: false,
        }

        const data = stats.toJson({
          ...statsOptions,
          ...statsJsonOptions,
          source: false,
        })

        const { statsCacheKey } = this

        this.runtime.fileManager.cache
          .put(statsCacheKey + ':json', JSON.stringify(data))
          .then(integrity => {
            handler([
              {
                type: 'stats:json',
                value: [this.runtime.fileManager.cache.cachePath, integrity.toString()].join('::'),
              },
            ])
          })
          .catch(error => {
            console.error('Error writing stats', error)
          })
        this.runtime.fileManager.cache
          .put(statsCacheKey + 'string', stats.toString(statsOptions))
          .then(integrity => {
            handler([
              {
                type: 'stats:string',
                value: [this.runtime.fileManager.cache.cachePath, integrity.toString()].join('::'),
              },
            ])
          })
          .catch(error => {
            console.error('Error writing stats', error)
          })
      } catch (error) {
        console.error('error', error)
      }

      if (!this.minimal) {
        this.observeMetrics(stats).subscribe({
          next: message => handler([message]),
          error: err => {
            console.log('Error from inspectpack:', err) // eslint-disable-line no-console
            this.cleanup()
          },
          complete: this.cleanup,
        })
      }
    })
  }

  observeMetrics(statsObj) {
    // Get the **full** stats object here for `inspectpack` analysis.
    const statsToObserve = statsObj.toJson()

    const getSizes = stats =>
      actions('sizes', { stats })
        .then(instance => instance.getData())
        .then(data => ({
          type: 'sizes',
          value: data,
        }))
        .catch(err => ({
          type: 'sizes',
          error: true,
          value: serializeError(err),
        }))

    const getProblems = stats =>
      Promise.all(
        INSPECTPACK_PROBLEM_ACTIONS.map(action =>
          actions(action, { stats }).then(instance => instance.getData())
        )
      )
        .then(datas => ({
          type: INSPECTPACK_PROBLEM_TYPE,
          value: INSPECTPACK_PROBLEM_ACTIONS.reduce(
            (memo, action, i) =>
              Object.assign({}, memo, {
                [action]: datas[i],
              }),
            {}
          ),
        }))
        .catch(err => ({
          type: INSPECTPACK_PROBLEM_TYPE,
          error: true,
          value: serializeError(err),
        }))

    const sizesStream = most.of(statsToObserve).map(getSizes)
    const problemsStream = most.of(statsToObserve).map(getProblems)

    return most.mergeArray([sizesStream, problemsStream]).chain(most.fromPromise)
  }
}

const serializeError = err => ({
  code: err.code,
  message: err.message,
  stack: err.stack,
})

const deserializeError = serializedError => {
  const err = new Error()
  err.code = serializedError.code
  err.message = serializedError.message
  err.stack = serializedError.stack
  return err
}

module.exports = SkypagerSocketPlugin
