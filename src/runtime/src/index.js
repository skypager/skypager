require('@babel/polyfill/noConflict')

const { createSingleton } = require('./runtime')

if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

if (typeof process === 'undefined') {
  global.process = { env: {} }
} else {
  global.process = process
}

/**
 * The runtime singleton
 */
module.exports = createSingleton()
