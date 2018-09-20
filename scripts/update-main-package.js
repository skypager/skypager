const runtime = require('@skypager/node')
const { clear, print, randomBanner } = runtime.cli

async function main() {
  clear()
  randomBanner('Skypager')
  print(`Updating main skypager package versions`)
  await runtime.fileManager.startAsync()
  await runtime.packageManager.startAsync()

  const web = runtime.packageManager.findByName('@skypager/web')
  const universal = runtime.packageManager.findByName('@skypager/runtime')
  const node = runtime.packageManager.findByName('@skypager/node')
  const cli = runtime.packageManager.findByName('@skypager/cli')
  const main = runtime.packageManager.findByName('skypager')

  print(`Current Version: ${main.version}`)
  print(`Updating @skypager/web to ${web.version}`)
  print(`Updating @skypager/runtime to ${universal.version}`)
  print(`Updating @skypager/node to ${node.version}`)
  print(`Updating @skypager/cli to ${cli.version}`)

  await runtime.fsx.mkdirpAsync(runtime.resolve(main._file.dir, 'dist'))

  await runtime.fsx.copyAsync(
    runtime.resolve(web._file.dir, 'lib', 'skypager-runtimes-web.min.js'),
    runtime.resolve(main._file.dir, 'dist', 'skypager-runtimes-web.min.js')
  )

  const { omit } = runtime.lodash

  const updatedPackage = omit(main, '_file', '_packageId')

  updatedPackage.dependencies = Object.assign({}, updatedPackage.dependencies, {
    [cli.name]: `^${cli.version}`,
    [node.name]: `^${node.version}`,
    [universal.name]: `^${universal.version}`,
    [web.name]: `^${web.version}`,
  })

  await runtime.fsx.writeFileAsync(main._file.path, JSON.stringify(updatedPackage, null, 2))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    print(colors.red('FAILURE'))
    print(error.message)
    print(error.stack, 8)
    process.exit(1)
  })
