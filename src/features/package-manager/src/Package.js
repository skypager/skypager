import _set from 'lodash/set'
import _get from 'lodash/get'

import { writeFileSync } from 'fs'

export default class Package {
  constructor(packageInfo, context = {}) {
    const { _file, _packageId, ...manifest } = packageInfo

    this._file = _file
    this._packageId = _packageId

    this._manifest = manifest

    Object.defineProperty(this, 'context', {
      enumerable: false,
      configurable: false,
      get: () => context,
    })

    const define = attr =>
      Object.defineProperty(this, attr, {
        enumerable: true,
        get: () => _get(this._manifest, attr),
        set: val => this.set(attr, val),
        configurable: true,
      })

    Object.keys(this._manifest).forEach(attr => {
      define(attr)
    })

    const set = this.set

    this.set = (attribute, value) => {
      if (Object.keys(this._manifest).indexOf(attribute) === -1) {
        define(attribute)
      }
      set(attribute, value)
    }
  }

  get taskRunner() {
    return this.packageManager.hasYarnPackageLock ? 'yarn' : 'npm'
  }

  spawnTask(task, args = [], options = {}) {
    args.unshift(task)

    if (this.taskRunner === 'npm') {
      args.unshift('run')
    }

    return this.runtime.proc.async.spawn(this.taskRunner, args, {
      ...options,
      cwd: this._file.dir,
    })
  }

  spawnTaskSync(task, args = [], options = {}) {
    args.unshift(task)

    if (this.taskRunner === 'npm') {
      args.unshift('run')
    }

    return this.runtime.proc.spawnSync(this.taskRunner, args, {
      ...options,
      cwd: this._file.dir,
    })
  }

  get runtime() {
    return this.context.runtime
  }

  get packageManager() {
    return this.context.packageManager
  }

  get dependents() {
    return this.packageManager.findDependentsOf(this.name, { type: 'both' })
  }

  get devDependents() {
    return this.packageManager.findDependentsOf(this.name, { type: 'development' })
  }

  get productionDependents() {
    return this.packageManager.findDependentsOf(this.name, { type: 'production' })
  }

  set(attribute, value) {
    _set(this._manifest, attribute, value)
    this.packageManager.entities.set(this.name, this._manifest)
    this.save()
    return value
  }

  save() {
    writeFileSync(this._file.path, JSON.stringify(this._manifest, null, 2))
  }
}
