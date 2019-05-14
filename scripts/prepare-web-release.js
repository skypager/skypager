const runtime = require('@skypager/node')
const { print } = runtime.cli

main()

async function main() {
  print(`Copying Web Builds to public folder`)
  await runtime.fsx.copyAsync(
    runtime.resolve('src', 'runtime', 'lib', 'skypager-runtime.js'),
    runtime.resolve('public', 'latest', 'skypager-runtime.js')
  )
  await runtime.fsx
    .copyAsync(
      runtime.resolve('src', 'runtime', 'lib', 'skypager-runtime.js.map'),
      runtime.resolve('public', 'latest', 'skypager-runtime.js.map')
    )
    .catch(e => e)
  await runtime.fsx.copyAsync(
    runtime.resolve('src', 'runtime', 'lib', 'skypager-runtime.min.js'),
    runtime.resolve('public', 'latest', 'skypager-runtime.min.js')
  )
  await runtime.fsx.copyAsync(
    runtime.resolve('src', 'runtime', 'lib', 'skypager-runtime.min.js.map'),
    runtime.resolve('public', 'latest', 'skypager-runtime.min.js.map')
  )
  await runtime.fsx.copyAsync(
    runtime.resolve('src', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.js'),
    runtime.resolve('public', 'latest', 'skypager-runtimes-web.js')
  )
  await runtime.fsx
    .copyAsync(
      runtime.resolve('src', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.js.map'),
      runtime.resolve('public', 'latest', 'skypager-runtimes-web.js.map')
    )
    .catch(e => e)
  await runtime.fsx.copyAsync(
    runtime.resolve('src', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.min.js'),
    runtime.resolve('public', 'latest', 'skypager-runtimes-web.min.js')
  )
  await runtime.fsx.copyAsync(
    runtime.resolve('src', 'runtimes', 'web', 'lib', 'skypager-runtimes-web.min.js.map'),
    runtime.resolve('public', 'latest', 'skypager-runtimes-web.min.js.map')
  )
}
