const skypager = require('@skypager/node')

Object.assign(global, {
  skypager,
  runtime: skypager,
  ...skypager.sandbox,
})
