if (typeof window !== 'undefined') {
  window.global = window

  if (typeof process === 'undefined') {
    window.process = { env: {} }
  }
}

const { createSingleton } = require('./runtime')

/**
 * The runtime singleton
 */
module.exports = createSingleton()
