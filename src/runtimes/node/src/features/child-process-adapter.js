import { Feature } from '@skypager/runtime/lib/helpers/feature'

import * as cp from 'child_process'
import * as cpAsync from 'child-process-promise'

/**
 * @typedef {Object} AsyncProcInterface
 * @prop {Function} spawn
 * @prop {Function} execFile
 * @prop {Function} fork
 * @prop {Function} exec
 */
/**
 * @class ChildProcessAdapter
 * @classdesc provides some utility functions for spawning processes based on top of child_process and child-process-promise.
 * The functions are always defaulting to use the cwd of the host runtime that is using them.
 * @example
 *
 *  import runtime from '@skypager/node'
 *  const { exec } = runtime.proc // node's child_process
 *  const { spawn } = runtime.proc.async // child-process-promise
 */
export default class ChildProcessAdapter extends Feature {
  static isSkypagerHelper = true

  static shortcut = 'proc'
  shortcut = 'proc'

  /**
   * asynchronously Spawn a process and capture the output as it runs.
   *
   * @memberof ChildProcessAdapter
   * @param {Object} spawnOptions options to pass to the spawn function
   * @param {String} options.cmd the process to run
   * @param {Array<String>} options.args an array of arguments to pass tot he process
   * @param {Object<string, any>} options.options options to pass to spawn
   * @param {Object} options options for the behavior of capture
   * @param {Function} options.onErrorOutput a function which will be continulally passed error output as a string as it is received, and information about the process
   * @param {Function} options.onOutput a function which will be continually passed normal output as a string as it is received, and information about the process
   */
  async spawnAndCapture({ cmd, args, options: opts }, options = {}) {
    const { spawn } = this.async

    const job = spawn(cmd, args, {
      cwd: this.runtime.cwd,
      ...opts,
    })

    const { childProcess } = job

    const errorOutput = []
    const normalOutput = []

    const { onError, onErrorOutput, onOutput } = options

    childProcess.stderr.on('data', buf => {
      const content = buf.toString()
      errorOutput.push(content)
      if (typeof onErrorOutput === 'function') {
        onErrorOutput(content, { cwd: this.runtime.cwd, args, options: opts, cmd, childProcess })
      }
    })

    childProcess.stdout.on('data', buf => {
      const content = buf.toString()
      normalOutput.push(content)

      if (typeof onOutput === 'function') {
        onOutput(content, { cwd: this.runtime.cwd, args, options: opts, cmd, childProcess })
      }
    })

    try {
      await job

      return {
        errorOutput,
        normalOutput,
        childProcess,
        options: { cwd: this.runtime.cwd, args, cmd, options: opts },
      }
    } catch (error) {
      const e = new Error(`${cmd} ${args.join(' ')} failed in ${name}`)

      e.cwd = this.runtime.cwd
      e.childProcess = childProcess
      e.errorOutput = errorOutput
      e.normalOutput = normalOutput
      e.original = error
      e.options = { cmd, args, options: opts }

      if (typeof onError === 'function') {
        onError(e)
      } else {
        throw e
      }
    }
  }

  /**
   * A wrapper around child_process.exec that sets the cwd to the same as the host runtime
   *
   * @param {String} cmd the command you wish to execute
   * @param {Object} options options to pass to child_process.exec
   * @param {*} args args that get passed through
   * @memberof ChildProcessAdapter
   */
  exec(cmd, options, ...args) {
    return cp.exec(cmd, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * Perform a child_process execFile
   *
   * @param {String} cmd
   * @param {Array} argv
   * @param {Object} options
   * @memberof ChildProcessAdapter
   */
  execFile(cmd, argv, options, ...args) {
    return cp.execFile(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * Perform a child_process spawn
   *
   * @param {String} cmd
   * @param {Array} argv
   * @param {Object} options
   * @memberof ChildProcessAdapter
   */
  spawn(cmd, argv, options, ...args) {
    return cp.spawn(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }
  /**
   * Perform a child_process fork
   *
   * @param {String} cmd
   * @param {Array} argv
   * @param {Object} options
   * @memberof ChildProcessAdapter
   */
  fork(cmd, argv, options, ...args) {
    return cp.fork(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * Perform a child_process execFileSync
   *
   * @param {String} cmd
   * @param {Array} argv
   * @param {Object} options
   * @memberof ChildProcessAdapter
   */
  execFileSync(cmd, argv, options, ...args) {
    return cp.execFileSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * Perform a child_process.execSync
   *
   * @param {String} cmd
   * @param {Object} options
   * @param {...*} args
   * @memberof ChildProcessAdapter
   */
  execSync(cmd, options, ...args) {
    return cp.execSync(cmd, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * Perform a child_process.spawnSync
   *
   * @param {String} cmd
   * @param {Array} argv
   * @param {Object} options
   * @param {...*} args
   * @memberof ChildProcessAdapter
   */
  spawnSync(cmd, argv, options, ...args) {
    return cp.spawnSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * Perform a child_process.forkSync
   *
   * @param {String} cmd
   * @param {Array} argv
   * @param {Object} options
   * @param {...*} args
   * @memberof ChildProcessAdapter
   */
  forkSync(cmd, argv, options, ...args) {
    return cp.forkSync(cmd, argv, { cwd: this.runtime.cwd, ...options }, ...args)
  }

  /**
   * @memberof ChildProcessAdapter
   * @type {AsyncProcInterface}
   */
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
