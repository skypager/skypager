const runtime = require('@skypager/runtime')
console.log({
  runtimeVersion: require('@skypager/runtime/package.json').version,
  nodeRuntimeVersion: require('@skypager/node/package.json').version,
  fileManagerVersion: require('@skypager/features-file-manager/package.json').version,
  vm: runtime.vm,
  process: {
    title: process.title,
    argv: process.argv,
    stringified: `${global.process}`,
    matches: `${global.process}` === '[object process]',
  },
})
