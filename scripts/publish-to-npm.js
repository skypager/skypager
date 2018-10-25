const run = require('./shared/run')
const { selectApplication, colors, showHeader, print } = require('./shared/cli')
const { projectTask } = run

/**
 * --static : use the serve package to serve the static built site
 * --docker : run a docker container after it has been packaged
 * --build : build the site, only applicable when using --static
 * --port : which port to listen on
 */
run(async runtime => {
  
  let [app] = runtime.argv._
  const { defineTable } = runtime.cli
  const statusTable = defineTable('status', {
    head: ['Project', 'Latest', 'Current', 'Outdated'],
  })

  showHeader()

  const apps = await runtime
    .selectChain('development/applications')
    .then(chain => chain.reject(pkg => pkg._file.dir.match(/\/(vendor|copy)/)).keyBy('name'))

  const publishedVersions = await Promise.all(
    apps
      .omit('@skypager/portfolio')
      .entries()
      .value()
      .map(([name, pkg]) => {
        const latest = runtime.proc
          .execSync(`npm dist-tag ls ${name}`)
          .toString()
          .trim()
          .split('\n')
          .find(line => line.match(/^latest:/))
          .split(':')
          .pop()
          .trim()

        const current = pkg.version

        return [name, { name, current, latest }]
      })
  )

  const outdated = runtime.chain
    .plant(publishedVersions)
    .fromPairs()
    .values()
    .filter(row => row.latest !== row.current)
    .map(pkg => [pkg.name, apps.get([pkg.name, '_file', 'dir']).value()])
    .value()

  if (outdated.length === 0) {
    print('No packages to publish')
  }

  await Promise.all(
    outdated.map(([name, cwd]) => {
      print(`Publishing ${name}`)
      return runtime.proc.async
        .spawn('npm', ['publish'], {
          cwd,
          stdio: 'ignore',
        })
        .catch(error => {
          print(`Failed to publish ${name}`)
          console.error(error.message)
          process.exit(1)
        })
        .then(() => {
          console.log(
            `Published ${name} ${apps
              .get(name)
              .get('version')
              .value()}`
          )
        })
    })
  )
})
