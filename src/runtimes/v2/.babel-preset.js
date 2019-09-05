const { NODE_ENV, BUILD_ENV = NODE_ENV } = process.env

const isESBuild = BUILD_ENV === 'build-es'
const isUMDBuild = BUILD_ENV === 'build-umd'
const isLibBuild = BUILD_ENV === 'build' || isESBuild || isUMDBuild || NODE_ENV === 'test'
const isDocsBuild = NODE_ENV === 'development' || NODE_ENV === 'production'

const browsers = [
  'last 8 versions',
  'safari > 8',
  'firefox > 23',
  'chrome > 24',
  'opera > 15',
  'not ie < 11',
  'not ie_mob <= 11',
]

const plugins = [
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-export-namespace-from',
  '@babel/plugin-proposal-export-default-from',
  '@babel/plugin-proposal-object-rest-spread',
  [
    '@babel/plugin-transform-runtime',
    {
      regenerator: isDocsBuild,
    },
  ],

  /*
  // Plugins that allow to reduce the target bundle size
  'lodash',
  'transform-react-handled-props',
  [
    'transform-react-remove-prop-types',
    {
      mode: isUMDBuild ? 'remove' : 'wrap',
      removeImport: isUMDBuild,
    },
  ],
  // A plugin for react-static
  isDocsBuild && [
    'universal-import',
    {
      disableWarnings: true,
    },
  ],
  // A plugin for removal of debug in production builds
  isLibBuild && [
    'filter-imports',
    {
      imports: {
        './makeDebugger': ['default'],
        '../../lib': ['makeDebugger'],
      },
    },
  ],
  */
].filter(Boolean)

const config = () => ({
  compact: false,
  presets: [
    [
      '@babel/env',
      {
        modules: isESBuild || isUMDBuild ? false : 'commonjs',
        targets: {
          ...(isLibBuild && { node: '8.0.0' }),
          browsers,
        },
      },
    ],
    '@babel/react',
  ],
  plugins,
  /*
  env: {
    development: {
      plugins: ['react-hot-loader/babel'],
    },
    test: {
      plugins: [['istanbul', { include: ['src'] }]],
    },
  },
  */
})

//console.log(JSON.stringify(config(), null, 2))
//process.exit(0)
module.exports = config
