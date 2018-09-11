const run = require('./shared/run')
const { selectApplication, colors, showHeader, print } = require('./shared/cli')
const { projectTask } = run

run(async runtime => {
  // scripts/build internet-of-insurance
  let [app] = runtime.argv._

  const { dockerRegistry = '', dockerUsername = 'datapimp' } = runtime.argv

  const shouldBuildBase = runtime.argv.buildBase !== false
  const shouldBuildProject = runtime.argv.build !== false

  showHeader()

  const { spawn } = runtime.proc.async

  // gives us a lodash chain sequence we can reuse
  const apps = await runtime
    .selectChain('development/applications')
    .then(chain => chain.filter(app => app.name.startsWith('@skypager')))
    .then(chain => chain.keyBy(app => app.name.replace(/^@skypager\//, '')))

  const appNames = apps.keys().value()

  if (!app || appNames.indexOf(app.toLowerCase()) === -1) {
    app = await selectApplication(appNames)
  }

  const workingDir = apps
    .get(app)
    .get('_file.dir')
    .value()

  print('Building Base Docker Image')
  shouldBuildBase &&
    (await spawn(
      'docker',
      ['build', '-t', `${dockerUsername}/frontend-serve`, '.'],
      {
        stdio: runtime.argv.showOutput ? 'inherit' : 'ignore',
        cwd: runtime.resolve('src', 'containers', 'serve'),
      }
    ))

  print(`Running project build script.`)
  shouldBuildProject &&
    (await projectTask(workingDir, 'build', process.argv.slice(3), {
      stdio: runtime.argv.showOutput ? 'inherit' : 'ignore',
    }))

  const project = apps.get(app).value()

  const distRoot = runtime.resolve('dist', project.name)
  const destination = runtime.resolve(distRoot, project.version)

  print(`Copying into Package Destination: ${runtime.relative(destination)}`)
  await runtime.fsx.mkdirpAsync(distRoot)
  await runtime.fsx.copyAsync(runtime.resolve(workingDir, 'build'), destination)

  const hasDockerfile = await runtime.fsx.existsAsync(runtime.resolve(destination, 'Dockerfile'))

  const dockerContents = [
    `FROM ${dockerUsername}/frontend-serve`,
    'COPY . /app',
  ].join('\n')

  if (!hasDockerfile) {
    await runtime.fsx.writeFileAsync(
      runtime.resolve(destination, 'Dockerfile'),
      dockerContents,
      'utf8'
    )
  }

  const containerTag = `${project.name.replace(/^@skypager/, dockerUsername)}:${
    project.version
  }`
  print('Building App Docker Container')
  print(`${project.name} ${project.version}`)

  await spawn('docker', ['build', '-t', containerTag, destination], {
    stdio: runtime.argv.showOutput ? 'inherit' : 'ignore',
  })

  if (runtime.argv.latest) {
    await spawn(
      'docker',
      ['build', '-t', containerTag.replace(/\:\w+$/g, ':latest'), destination],
      {
        stdio: runtime.argv.showOutput ? 'inherit' : 'ignore',
      }
    )
  }

  print(colors.green('SUCCESS'), 0, 2, 2)
  print(`Built docker container: ${colors.magenta(containerTag)}`)
})
