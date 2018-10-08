require('@babel/polyfill/noConflict')
// tst
module.exports = global.skypager = global.SkypagerRuntime = require('./runtime').createSingleton()
