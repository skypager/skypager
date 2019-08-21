module.exports = {
  node: {
    process: 'mock',
    global: false,
  },
  output: {
    library: 'skypager',
    libraryExport: 'default',
  },
  resolve: {
    alias: {
      lodash: require.resolve('lodash/lodash.min.js'),
      mobx: require.resolve('./src/mobx.umd.min.js'),
      vm: 'vm-browserify',
    },
  },
}
