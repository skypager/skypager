const runtime = require('@skypager/node')
const { existsAsync: exists } = runtime.fsx
const { resolve } = runtime.pathUtils
const { fromPairs, isEmpty, omitBy, get, mapValues } = runtime.lodash
const { colors, print } = runtime.cli

async function main(...args) {
  const requestedHelp = runtime.argv.help || runtime.argv._[0] === 'help'

  if (requestedHelp) {
    displayHelp()
  } else {
    return handler(...args)
  }
}

function displayHelp() {
  const { colors, randomBanner, print } = runtime.cli

  randomBanner('Skypager')
  print(colors.bold.underline(`Skypager CLI Script Inspector`), 0, 0, 1)
  console.log(`
  Use when you want find out how a given skypager CLI command will be executed. 

  The skypager CLI will search your local project, your package scope, and the @skypager/* packages
  found in your node_modules resolution paths.  It will attempt to share any files found in the scripts/
  folder of any of these projects, provided that project's package.json declares that it provides that script
  as one that can be re-used in other skypager project folders. 
  `.trim()) 
}

async function handler(options = {}) {
  const { validScripts, scriptFolders } = await listAllScripts(options)

  const rootFolder =
    runtime.gitInfo.root && runtime.gitInfo.root.length ? runtime.gitInfo.root : runtime.cwd

  const localProjectHasScripts = await exists(runtime.resolve('scripts'))

  if (localProjectHasScripts) {
    print(
      colors.underline(`${colors.green('current project')}'s scripts folder provides:`),
      0,
      1,
      1
    )
    const scripts = await runtime.fsx.readdirAsync(runtime.resolve('scripts'))
    print(scripts.map(s => `- ${runtime.pathUtils.basename(s).replace(/\.js$/, '')}`), 4)
  }

  const report = omitBy(fromPairs(validScripts), isEmpty)

  mapValues(report, (scripts, packageName) => {
    print(colors.underline(`${colors.green(packageName)} provides:`), 0, 1, 1)
    print(scripts.map(s => `- ${runtime.pathUtils.basename(s).replace(/\.js$/, '')}`), 4)
  })

  if (options.verbose) {
    print(colors.underline(`Searched For Scripts In`), 0, 2, 1)
    print(
      scriptFolders.map(
        scriptFolder =>
          `- ${scriptFolder.replace(runtime.cwd, '$CWD').replace(rootFolder, '$GIT_ROOT')}`
      ),
      4
    )
  }
}

async function listAllScripts({ verbose = false }) {
  const searchPackagePaths = await runtime.packageFinder
    .find(/@skypager\/.*/)
    .then(results => [runtime.cwd].concat(results))

  const portfolioName = runtime.currentPackage.name.split('/')[0]

  if (portfolioName !== '@skypager') {
    const portfolioPackagePaths = await runtime.packageFinder.find(new RegExp(`^${portfolioName}`))
    searchPackagePaths.push(...portfolioPackagePaths)
  }

  // These are all of the packages which have a scripts/ folder
  // the name of the package must start with @skypager or the name of this portfolio
  const scriptFolders = await Promise.all(
    searchPackagePaths.map(folder => {
      const check = resolve(folder, 'scripts')
      return exists(check).then(yes => yes && check)
    })
  ).then(matches => matches.filter(Boolean))

  const results = await Promise.all(
    scriptFolders.map(folder => {
      const pkgManifest = require(runtime.pathUtils.resolve(folder, '..', 'package.json'))

      const { name } = pkgManifest

      let skypagerScriptsConfig = get(pkgManifest, `skypager.providesScripts`, [])
      let portfolioScriptsConfig = get(
        pkgManifest,
        [portfolioName.replace(/^@/, ''), 'providesScripts'],
        []
      )

      let validScripts = []
      let skip = false

      if (skypagerScriptsConfig === false) {
        validScripts = [name, []]
        skypagerScriptsConfig = []
        skip = true
      }

      if (portfolioScriptsConfig === false) {
        validScripts = [name, []]
        portfolioScriptsConfig = []
        skip = true
      }

      let scriptsConfig = runtime.lodash.uniq(portfolioScriptsConfig.concat(skypagerScriptsConfig))

      // if they don't explicitly provide scripts, and it isn't a helper, feature, devtool, or portfolio-manager
      // then the scripts are private
      if (scriptsConfig.length || skip) {
        // we'll search for the valid scripts
      } else if (
        !name.match(
          new RegExp(`${portfolioName}/(cli|features|helpers|devtools|portfolio-manager)`)
        )
      ) {
        scriptsConfig = []
      } else if (
        name.match(new RegExp(`${portfolioName}/(cli|features|helpers|devtools|portfolio-manager)`))
      ) {
        validScripts = runtime.fsx.readdirAsync(folder).then(names => [name, names])
      }

      if (!validScripts.length && scriptsConfig.length && !skip) {
        const checkPaths = scriptsConfig.map(scriptName =>
          runtime.pathUtils.resolve(folder, scriptName)
        )

        validScripts = runtime.fsx
          .existingAsync(...checkPaths.map(file => (file.endsWith('.js') ? file : `${file}.js`)))
          .then(paths => [name, paths])
      }

      return validScripts
    })
  ).then(v => v.filter(i => i && i.length))

  return {
    validScripts: results,
    scriptFolders,
    portfolioName,
    searchPackagePaths,
  }
}

if (require.main !== module) {
  module.exports = {
    listAllScripts,
  }
} else {
  main(runtime.argv)
}
