const runtime = require('@skypager/runtime')
console.log({
  vm: runtime.vm,
  process: {
    title: process.title,
    argv: process.argv,
    stringified: `${global.process}`,
    matches: `${global.process}` === '[object process]',
  },
})
