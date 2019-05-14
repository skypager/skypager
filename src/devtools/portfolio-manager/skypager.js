module.exports = {
  attach(runtime) {
    try {
      runtime.use(require('.'))
    } catch (error) {}
  },
}
