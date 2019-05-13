module.exports = {
  node: {
    process: 'mock',
    global: false,
  },
  resolve: {
    alias: {
      lodash: require.resolve('lodash/lodash.min.js'),
      mobx: require.resolve('./src/mobx.umd.min.js'),
      vm: 'vm-browserify',
    },
  },
}
