const runtime = require('..').use(require('@skypager/helpers-document'))

async function main() {
  await runtime.scripts.discover({
    defaults: {
      babelConfig: require('@skypager/helpers-document/src/babel/babel-config')({
        presetEnv: {
          modules: 'auto',
        },
      }),
    },
  })

  const featureModuleIds = runtime.scripts.available.filter(
    id => id.startsWith('src/features') && !id.endsWith('index')
  )

  const s = runtime.script('src/features/child-process-adapter')
  const f = runtime.script('src/features/fs-adapter')

  await s.parse()
  await f.parse()

  await Promise.all(featureModuleIds.map(id => runtime.script(id).parse()))

  const featureModules = runtime.lodash.fromPairs(
    featureModuleIds.map(id => [id, runtime.script(id)])
  )

  const withHostMethods = runtime.lodash.pickBy(
    featureModules,
    s =>
      s.exportNames &&
      s.exportNames.indexOf('hostMethods') !== -1 &&
      s.exportNames.indexOf('default') === -1
  )
  const withoutHostMethods = runtime.lodash.pickBy(
    featureModules,
    s =>
      s.exportNames &&
      s.exportNames.indexOf('hostMethods') === -1 &&
      s.exportNames.indexOf('default') === -1
  )

  console.log('migrating features without host methods')
  await Promise.all(
    Object.keys(withoutHostMethods).map(id => {
      console.log(`  ${id}`)
      // console.log(runtime.script(id).exportNames)
      return id
    })
  )

  console.log('migrating features with host methods')
  await Promise.all(
    Object.keys(withHostMethods).map(id => {
      console.log(`  ${id}`)
      // console.log(runtime.script(id).exportNames)
      return id
    })
  )

  if (runtime.argv.interactive) {
    await runtime
      .repl('interactive')
      .launch({ runtime, s, f, featureModules, withHostMethods, withoutHostMethods })
  }
}

main()
