if (typeof window !== 'undefined') {
  window.global = window

  if (typeof process === 'undefined') {
    window.process = { env: {} }
  }
}

const webRuntime = require('./index').default

/**
 * The runtime singleton
 */
module.exports = webRuntime
