require('@babel/polyfill/noConflict')

if (typeof global === 'undefined' && typeof window !== 'undefined') {
  window.global = window
}

module.exports = global.skypager = global.SkypagerRuntime = require('./runtime').createSingleton()
