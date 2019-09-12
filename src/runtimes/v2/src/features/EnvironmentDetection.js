const windowIsAvailable = typeof window !== 'undefined'
const documentIsAvailable = typeof document !== 'undefined'
const processIsAvailable = typeof process !== 'undefined'

const isUndefined = val => typeof val === 'undefined'

export function getIsBrowser() {
  return windowIsAvailable && documentIsAvailable
}

export function getIsNode() {
  try {
    const isNode = Object.prototype.toString.call(global.process) === '[object process]'
    return isNode
  } catch (e) {
    return processIsAvailable && (process.title === 'node' || `${process.title}`.endsWith('.exe'))
  }
}

export function getIsWindows() {
  return this.isNode && `${process.title}`.endsWith('.exe')
}

export function getIsElectron() {
  return (
    processIsAvailable &&
    !isUndefined(process.type) &&
    !isUndefined(process.title) &&
    (process.title.match(/electron/i) || process.versions['electron'])
  )
}

export function getIsElectronRenderer() {
  return (
    !isUndefined(process) && process.type === 'renderer' && windowIsAvailable && documentIsAvailable
  )
}

export function getIsReactNative() {
  try {
    return (
      !isUndefined(global) &&
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    )
  } catch (error) {
    return false
  }
}

export function getIsDebug() {
  const { argv = {} } = this
  return !!argv.debug || argv.debugBrk || argv.inspect || argv.inspectBrk
}

export function getIsCI() {
  return this.isNode && (process.env.CI || (process.env.JOB_NAME && process.env.BRANCH_NAME))
}

export function getIsDevelopment() {
  const { argv = {} } = this

  return (
    !this.isProduction &&
    !this.isTest &&
    (argv.env === 'development' || process.env.NODE_ENV === 'development')
  )
}

export function getIsTest() {
  const { argv = {} } = this
  return argv.env === 'test' || process.env.NODE_ENV === 'test'
}

export function getIsProduction() {
  const { argv } = this
  return argv.env === 'production' || process.env.NODE_ENV === 'production'
}
