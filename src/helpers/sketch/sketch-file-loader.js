const { stringifyRequest, getOptions } = require('loader-utils')
const { exec, spawn } = require('child-process-promise')
const cli = require('./cli')

const { viewSketchMetadata } = cli

module.exports = async function(raw) {
  this.cacheable && this.cacheable()
  const callback = this.async()
  const options = getOptions(this)
  const { view = 'meta' } = options

  let output = ''

  switch (view) {
    case 'meta':
    case 'metadata':
    default:
      const metaJson = await viewSketchMetadata(this.resourcePath)
      output = `module.exports = ${metaJson}`
  }

  return callback(null, output)
}
