class BuildCachePlugin {
  constructor(options = {}) {
    this.options = options
    this.currentProject = options.currentProject
  }

  apply(compiler) {
    compiler.hooks.done.tap('BuildCachePlugin', async stats => {
      if (!stats.hasErrors() && !stats.hasWarnings()) {
        await this.currentProject.saveBuildSummary({
          webpackHash: stats.hash,
          buildTime: stats.time,
        })
      }

      return true
    })
  }
}

module.exports = BuildCachePlugin
