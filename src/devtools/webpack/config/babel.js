module.exports = function(options = {}) {
  const babelConfig = {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          modules: false,
          targets: options.targets || {
            browsers: ['last 2 versions', 'ie >= 11', 'safari >= 10'],
            node: '6.11.1',
          },
          ...(options.presetEnv || {}),
        },
      ],
      require.resolve('@babel/preset-react'),
    ],
    plugins: [
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      require.resolve('@babel/plugin-proposal-class-properties'),
      require.resolve('@babel/plugin-proposal-export-default-from'),
      require.resolve('@babel/plugin-proposal-object-rest-spread'),
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      options.lodash !== false && [
        require.resolve('babel-plugin-lodash'),
        { id: ['lodash', 'semantic-ui-react'] },
      ],
    ].filter(Boolean),
    ignore: ['**/lib/**', '**/dist/**'],
    env: {
      development: {
        plugins: [require.resolve('react-hot-loader/babel')],
      },
      production: {
        plugins: [require.resolve('babel-plugin-transform-react-remove-prop-types')],
      },
    },
  }

  return babelConfig
}
