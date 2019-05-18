module.exports = function(options = {}) {
  const {
    modules = false,

    browsers = [
      'last 8 versions',
      'safari > 8',
      'firefox > 23',
      'chrome > 24',
      'opera > 15',
      'not ie < 11',
      'not ie_mob <= 11',
    ],

    plugins = [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-object-rest-spread',
      [
        '@babel/plugin-transform-runtime',
        {
          regenerator: false,
        },
      ],
    ].filter(Boolean),
  } = options

  const config = {
    compact: false,
    presets: [
      [
        '@babel/env',
        {
          modules: modules,
          targets: {
            browsers,
          },
        },
      ],
      '@babel/react',
    ],
    plugins,
  }

  return config
}
