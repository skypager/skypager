module.exports = {
  output: {
    library: 'skypager',
    libraryExport: 'default',
  },
  resolve: {
    alias: {
      '@skypager/runtime': require.resolve('@skypager/runtime/lib/es/index.js'),
      '@skypager/helpers-client': require.resolve('@skypager/helpers-client/lib/es/index.js'),
    },
  },
}
