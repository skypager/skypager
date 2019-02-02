import { Feature } from '@skypager/runtime/lib/helpers/feature'

import * as cp from 'child_process'
import * as cpAsync from 'child-process-promise'

export default class ChildProcessAdapter extends Feature {
  static isSkypagerHelper = true

  static shortcut = 'proc'

  shortcut = 'proc'

  exec(cmd, options, ...args) {
    return cp.exec(cmd, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  execFile(cmd, argv, options, ...args) {
    return cp.execFile(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  spawn(cmd, argv, options, ...args) {
    return cp.spawn(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  fork(cmd, argv, options, ...args) {
    return cp.fork(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  execFileSync(cmd, argv, options, ...args) {
    return cp.execFileSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  execSync(cmd, options, ...args) {
    return cp.execSync(cmd, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  spawnSync(cmd, argv, options, ...args) {
    return cp.spawnSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  forkSync(cmd, argv, options, ...args) {
    return cp.forkSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  get async() {
    const { runtime } = this
    const cwd = runtime.cwd

    return {
      exec(cmd, options = {}, ...args) {
        return cpAsync.exec(cmd, { cwd, ...options }, ...args)
      },
      execFile(cmd, a = [], options = {}, ...args) {
        return cpAsync.execFile(cmd, a, { cwd, ...options }, ...args)
      },
      spawn(cmd, a = [], options = {}, ...args) {
        return cpAsync.spawn(cmd, a, { cwd, ...options }, ...args)
      },
      fork(cmd, a = [], options = {}, ...args) {
        return cpAsync.fork(cmd, a, { cwd, ...options }, ...args)
      },
    }
  }
}
