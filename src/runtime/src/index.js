require('@babel/polyfill/noConflict')
module.exports = global.skypager = global.SkypagerRuntime = require('./runtime').createSingleton()
