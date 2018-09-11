import * as cp from 'child_process'

import * as cpAsync from 'child-process-promise'

export const createGetter = 'proc'

export function exec(cmd, options, ...args) {
  return cp.exec(cmd, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function execFile(cmd, argv, options, ...args) {
  return cp.execFile(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function spawn(cmd, argv, options, ...args) {
  return cp.spawn(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function fork(cmd, argv, options, ...args) {
  return cp.fork(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function execFileSync(cmd, argv, options, ...args) {
  return cp.execFileSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function execSync(cmd, options, ...args) {
  return cp.execSync(cmd, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function spawnSync(cmd, argv, options, ...args) {
  return cp.spawnSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function forkSync(cmd, argv, options, ...args) {
  return cp.forkSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
}

export function lazyAsync() {
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

export const featureMethods = [
  'lazyAsync',
  'spawn',
  'spawnSync',
  'exec',
  'execSync',
  'fork',
  'forkSync',
  'execFile',
  'execFileSync',
]

export function featureMixinOptions() {
  return {
    transformKeys: true,
    scope: this,
    partial: [],
    insertOptions: false,
    right: true,
    hidden: false,
  }
}
