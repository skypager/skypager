export const createGetter = 'os'

export const featureMethods = [
  'getArch',
  'getPlatform',
  'getNetworkInterfaces',
  'getEnvironment',
  'getOs',
  'getCpuCount',
  'getUptime',
  'getMacAddresses',
]

export function getPlatform() {
  return require('os').platform()
}

export function getArch() {
  return require('os').arch()
}

export function getEnvironment() {
  return process.env || {}
}

export function getUptime() {
  return require('os').uptime()
}

export function getCpuCount() {
  return require('os').cpus().length
}

export function getMacAddresses() {
  return this.chain
    .get('networkInterfaces')
    .values()
    .flatten()
    .map('mac')
    .uniq()
    .value()
}

export function getNetworkInterfaces() {
  return this.runtime.lodash.omitBy(require('os').networkInterfaces(), v =>
    v.find(a => a.address === '127.0.0.1')
  )
}

export function getHostname() {
  return (
    process.env.SKYPAGER_HOSTNAME ||
    this.tryResult(
      'hostname',
      [this.runtime.get('currentPackage.name', 'skypager'), 'skypager', 'local'].join('.')
    )
  )
}

export function getOs() {
  return require('os')
}
