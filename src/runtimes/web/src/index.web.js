if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

if (typeof process === 'undefined') {
  global.process = { env: {} }
}

const webRuntime = require('./index').default

/**
 * The runtime singleton
 */
module.exports = webRuntime
