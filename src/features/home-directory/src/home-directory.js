import { relative, resolve, join } from 'path'

export const hostMethods = ['getHomeFolder']

export const hostMixinOptions = {
  hidden: true,
}

export const featureMethods = [
  'initializeHomeFolder',
  'createHomePackageManifest',
  'installHomeDependencies',
  'linkFrameworkExecutables',
  'installFrameworkShortcuts',
]

export const defaultPackageContent = {
  private: true,
  name: 'skypager-home-package',
  description: 'houses the internal skypager package system',
  version: '1.0.0',
  dependencies: {
    '@skypager/node': require('@skypager/node/package.json').version,
  },
}

export function featureWasEnabled(options = {}) {
  this.setupSkypagerHome(options).then(() => {})
}

export function setupSkypagerHome(options = {}) {
  const { runtime } = this
  const { homeFolderName = '.skypager', homeFolder = homedir() } = {
    ...runtime.options,
    ...options,
  }
  const homeFolderPath = options.homeFolderPath || resolve(homeFolder, homeFolderName)

  this.initializeHomeFolder({ homeFolderPath, homeFolderName, ...options }, this.context)
    .then(() => this.createHomePackageManifest())
    .catch(error => {
      runtime.error(`Error while initializing home folder`, { message: error.message })
      this.set('initError', error)
      return {}
    })
}

export function installHomeDependencies(options = {}) {
  return this.runtime.proc.async.spawn('npm', ['install'], {
    cwd: this.runtime.homeFolder.path,
    ...options,
  })
}

export async function installFrameworkShortcuts(options = {}) {}

export async function linkFrameworkExecutables(options = {}) {
  await this.runtime.fsx.ensureSymlinkAsync(
    this.runtime.homeFolder.join('node_modules', 'skypager-cli-base', 'skypager-cli'),
    this.runtime.homeFolder.join('bin', 'skypager-cli')
  )
}

export async function createHomePackageManifest(options = {}) {
  const exists = await this.runtime.fsx.existsAsync(this.runtime.homeFolder.resolve('package.json'))

  if (!exists) {
    await this.runtime.homeFolder.writeFileAsync(
      this.runtime.homeFolder.join('package.json'),
      JSON.stringify(defaultPackageContent, null, 2),
      'utf8'
    )
  }

  return this
}

export async function initializeHomeFolder(options = {}, context = {}) {
  const { runtime } = this
  const { fsx = runtime.fsx } = context
  const {
    homeFolderPath,
    subfolders = ['logs', 'src', 'pkg', 'bin', '.cache', '.secrets'],
  } = this.lodash.defaults({}, options, this.options)
  const { ensureDirAsync } = runtime.fsx

  await fsx.mkdirpAsync(homeFolderPath)

  await Promise.all(subfolders.map(sub => ensureDirAsync(resolve(homeFolderPath, sub))))

  return this
}

export async function createShortcuts(options = {}) {
  const { isEmpty } = this.lodash
}

export function getHomeFolder(options = {}, context = {}) {
  const runtime = this
  const { fsx } = runtime

  const { homeFolderName = '.skypager', homeFolder = homedir() } = { ...this.options, ...options }

  const homeFolderPath = resolve(homeFolder, homeFolderName)

  const fsxMethods = Object.keys(fsx).filter(m => m.match(/sync$/i))

  const partialize = (...args) => {
    if (typeof args[0] === 'string') {
      args[0] = resolve(homeFolderPath, args[0])
    }

    return args
  }

  return {
    path: homeFolderPath,
    homedir: homeFolder,
    join: (...args) => join(homeFolderPath, ...args),
    resolve: (...args) => resolve(homeFolderPath, ...args),
    relative: (...args) => relative(homeFolderPath, ...args),
    ...fsxMethods.reduce(
      (memo, meth) => ({
        ...memo,
        [meth]: (...args) => {
          return runtime.fsx[meth](...partialize(...args))
        },
      }),
      {}
    ),
  }
}

function homedir() {
  var env = process.env
  var home = env.HOME
  var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME

  if (process.platform === 'win32') {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null
  }

  if (process.platform === 'darwin') {
    return home || (user ? '/Users/' + user : null)
  }

  if (process.platform === 'linux') {
    return home || (process.getuid() === 0 ? '/root' : user ? '/home/' + user : null)
  }

  return home || null
}
