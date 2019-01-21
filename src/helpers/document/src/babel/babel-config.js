module.exports = function(options = {}) {
  const babelConfig = {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        Object.assign(
          {
            targets: options.targets || {
              browsers: ['last 2 versions', 'ie >= 11', 'safari >= 10'],
              node: '9.11.1',
            },
          },
          options.presetEnv || {}
        ),
      ],
      require.resolve('@babel/preset-react'),
    ],
    plugins: [
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      require.resolve('@babel/plugin-proposal-class-properties'),
      require.resolve('@babel/plugin-proposal-export-default-from'),
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      require.resolve('@babel/plugin-syntax-dynamic-import'),
    ].filter(Boolean),
  }

  return babelConfig
}
