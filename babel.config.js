module.exports = api => {
  api.cache(true)

  return {
    presets: [
      [
        '@babel/env',
        {
          modules: false,
          targets: {
            browsers: 'Last 2 Chrome versions, Firefox ESR',
            node: 'current',
          },
        },
      ],
      [
        '@babel/preset-react',
        {
          development: process.env.BABEL_ENV !== 'build',
        },
      ],
      '@babel/preset-typescript',
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-transform-runtime',
    ],
    env: {
      build: {
        ignore: ['**/*.test.*', '**/*.spec.*', '**/*.d.*', '__snapshots__', '__tests__'],
      },
    },
    ignore: ['node_modules'],
  }
}
