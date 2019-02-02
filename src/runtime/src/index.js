require('@babel/polyfill/noConflict')

const { createSingleton } = require('./runtime')

/**
 * The runtime singleton
 */
module.exports = createSingleton()
