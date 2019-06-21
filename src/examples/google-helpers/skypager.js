module.exports = {
  attach(runtime) {
    runtime.use(require(runtime.packageFinder.attemptResolve('@skypager/helpers-document')))
  },
}
