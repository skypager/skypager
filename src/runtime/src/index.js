/**
 * @module @skypager/runtime
 * @description Importing the @skypager/runtime module will give you a global singleton instance of Runtime
 */
require('@babel/polyfill/noConflict')

const { createSingleton } = require('./runtime')

/**
 * @typedef {import("./runtime").Runtime} Runtime
 */

/**
 * @type {Runtime}
 */
const runtime = createSingleton()

/**
 * @type {Runtime}
 */
module.exports = runtime
