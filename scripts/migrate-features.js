const runtime = require('@skypager/node')
const DocumentHelper = require('@skypager/helpers-document')

const { cli, fsx, fileManager, packageManager } = runtime 

const { print, colors } = cli
const { copyAsync: copy, mkdirpAsync: mkdirp, existsAsync: exists, writeFileAsync: writeFile } = fsx
const { camelCase } = runtime.stringUtils
const { isEmpty, pick } = runtime.lodash

const nodeRuntime = runtime
  .spawn({ cwd: runtime.resolve('src', 'runtimes', 'node') })
  .use('runtimes/node')
  .use(DocumentHelper)

let nodeManifest = nodeRuntime.currentPackage

async function main() {
  await fileManager.startAsync()
  await packageManager.startAsync()
  await nodeRuntime.fileManager.startAsync()
  await nodeRuntime.scripts.discover()

  const features = nodeRuntime.fileManager.chains
    .route('src/features/:name.js')
    .omit('src/features/index.js')
    .mapKeys(v => v.meta.name)
    .mapValues('path')
    .value()

  runtime.setState({ migrations: features })

  const featureNames = Object.keys(features)

  for (let feature of featureNames) {
    const sourceModule = features[feature]
    const destination = runtime.resolve('src', 'features', feature)
    const packageName = `@skypager/features-${feature}`

    await migrateFeature({
      name: feature,
      sourceModule,
      destination,
      packageName,
      version: nodeManifest.version,
      nodeRuntime,
    })

    nodeManifest = {
      ...nodeManifest,
      dependencies: {
        ...nodeManifest.dependencies,
        [packageName]: nodeManifest.version,
      },
    }
  }

  await nodeRuntime.fsx.writeFileAsync(
    nodeRuntime.resolve('package.json'),
    JSON.stringify(nodeManifest, null, 2)
  )
}

main()

async function migrateFeature({
  name,
  sourceModule,
  destination,
  packageName,
  version,
  nodeRuntime,
}) {
  const sourceScript = nodeRuntime.script(`src/features/${name}`)

  await sourceScript.parse()

  const nodeDeps = {
    ...(nodeManifest.dependencies || {}),
    ...(nodeManifest.devDependencies || {}),
  }

  const npmDeps = sourceScript.importsModules.filter(mod => nodeDeps[mod])

  print(`${colors.green('Migrating')} ${name} to ${colors.green(packageName)}`, 0, 1, 0)
  print(`Source Feature: ${runtime.relative(sourceModule)}`, 2)
  print(`Destination Directory: ${runtime.relative(destination)}`, 2, 0, 0)

  await mkdirp(runtime.resolve(destination, 'src'))
  await mkdirp(runtime.resolve(destination, 'test'))
  await copy(sourceModule, runtime.resolve(destination, 'src', `${name}.js`))
  await copy(nodeRuntime.resolve('.babelrc'), runtime.resolve(destination, '.babelrc'))

  await copy(
    nodeRuntime.resolve('.babel-preset.js'),
    runtime.resolve(destination, '.babel-preset.js')
  )

  await writeFile(
    runtime.resolve(destination, 'package.json'),
    JSON.stringify(manifest(packageName, version, pick(nodeDeps, npmDeps)), null, 2),
    'utf8'
  )

  await writeFile(runtime.resolve(destination, 'src', 'index.js'), indexJs(name), 'utf8')

  if (npmDeps.length) {
    print('Dependencies:', 2)
    print(npmDeps.map(name => `${colors.magenta(name)} ${colors.cyan(nodeDeps[name])}`), 4)
  }
}

function readme(name) {
  return `
# ${name} Feature
> a feature for the @skypager/node runtime

This feature is automatically registered and setup for you when you're using @skypager/node.

  `.trim()
}

function indexJs(name) {
  const featureName = camelCase(name)

  return (
    `
import * as ${featureName} from './${name}.js'

export function attach(runtime) {
  runtime.features.register('${name}', () => ${featureName})
}
  `.trim() + '\n'
  )
}

function manifest(name, version, dependencies) {
  return {
    name,
    version,
    description: `a ${name} feature for the @skypager/node runtime`,
    author: 'Jon Soeder <jon@chicago.com>',
    main: 'lib/index.js',
    publishConfig: {
      registryAccess: 'public',
    },
    ...(!isEmpty(dependencies) && { dependencies }),
    scripts: {
      prepare: 'yarn build',
      prebuild: 'rimraf lib && yarn docs:api',
      build: 'yarn build:lib && yarn build:es',
      'build:lib': 'cross-env BUILD_ENV=build babel -d lib src --source-maps --comments',
      'build:es': 'cross-env BUILD_ENV=build-es babel --comments --source-maps -d lib/es src',
      postbuild: 'skypager hash-build',
      'docs:api': 'skypager generate-api-docs',
      test: 'skypager test --mocha --timeout 10000 test/**/*.spec.js',
    },
    license: 'MIT',
    keywords: ['skypager', 'node features'],
    contributors: ['jon@chicago.com'],
    skypager: {
      category: 'features',
      projectType: 'feature',
      providesScripts: false,
    },
    module: 'lib/es/index.js',
    homepage: 'https://skypager.io',
  }
}
