const ContentManager = {
  isObservable: true,

  shortcut: 'contentManager',

  featureMethods: ['start', 'getSourceModules', 'source'],

  observables: {
    scripts: ['shallowMap', []],
  },

  source(id) {
    return this.runtime.script(id)
  },

  getSourceModules() {
    return this.scripts.keys().map(id => this.runtime.script(id))
  },

  async start({ include = [/src.*\.js$/] } = {}) {
    await this.runtime.scripts.discover({ include })
    await this.runtime.fileManager.hashFiles(include)

    const matches = this.runtime.fileManager.chains
      .patterns(...include)
      .keys()
      .map(v => String(v).replace(/\.js$/, ''))
      .value()

    return Promise.all(
      matches.map(scriptId => {
        const script = this.runtime.script(scriptId)

        this.scripts.set(scriptId, {
          scriptId,
          file: this.runtime.fileManager.file(`${scriptId}.js`),
        })

        return script.parse().then(() => script)
      })
    )
  },
}

module.exports = {
  attach(runtime, options = {}) {
    runtime.features.register('content-manager', () => ContentManager)
    runtime.feature('content-manager', options).enable()
  },
}
