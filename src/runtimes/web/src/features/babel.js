export const shortcut = 'babel'

export const featureMethods = ['loadBabel', 'compile', 'getVm', 'createCodeRunner', 'whenReady']

export const featureMixinOptions = {
  partial: [],
  insertOptions: false,
}

export async function featureWasEnabled(options = {}) {
  this.hide('babelConfig', this.lodash.pick(options, 'presets', 'plugins'))

  await this.loadBabel(options).catch(error => {
    this.runtime.error(`Error loading babel: ${error.message}`)
  })
}

export function getVm() {
  return this.runtime.vm
}

export function whenReady(fn) {
  if (typeof fn === 'undefined') {
    return new Promise((resolve, reject) => {
      whenReady.call(this, (err, Babel) => {
        err ? reject(err) : resolve(Babel)
      })
    })
  }

  if (this.ready) {
    fn(null, global.Babel)
  } else {
    this.once('ready', Babel => {
      fn(null, Babel)
    })
  }
}

export async function loadBabel(options = {}) {
  const { runtime } = this
  const { assetLoader } = runtime

  if (this.loading) {
    return new Promise(resolve => {
      setTimeout(resolve, 20)
    }).then(() => this.loadBabel())
  }

  if (global.Babel) {
    this.ready = true
    this.emit('ready', global.Babel)
    return global.Babel
  }

  this.loading = true
  await assetLoader.inject.js(`https://unpkg.com/@babel/standalone@7.0.0/babel.min.js`)

  this.ready = true
  this.loading = false

  this.emit('ready', global.Babel)
  return global.Babel
}

export function createCodeRunner(code, options = {}) {
  const { runtime } = this
  const { vm } = runtime
  const { mapValues, pick } = this.lodash
  const compiled = this.compile(code)
  const script = vm.createScript(compiled)

  return (vars = {}) => {
    const sandbox = vm.createContext({
      ...pick(runtime.sandbox, 'mobx', 'lodash'),
      ...pick(global, 'React', 'ReactDOM', 'ReactRouter'),
      ...(global.semanticUIReact || {}),
    })

    mapValues(vars, (v, k) => {
      sandbox[k] = v
    })

    const result = script.runInContext(sandbox)

    this.lastSandbox = sandbox

    return options.sandbox ? { vars, result, sandbox, compiled } : result
  }
}

export function compile(code, options = {}) {
  const { Babel } = global
  const { omit } = this.lodash

  const babelOptions = {
    presets: ['es2015', ['stage-2', { decoratorsLegacy: true }], 'react'],
    ...(this.babelConfig || {}),
    ...omit(options, 'sandbox'),
  }

  return Babel.transform(code, babelOptions).code
}
