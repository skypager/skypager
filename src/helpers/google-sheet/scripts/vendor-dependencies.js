const runtime = require('@skypager/node')

async function main() {
  const exists = await runtime.fsx.existsAsync(
    runtime.resolve('src', 'deps', 'google-spreadsheet.js')
  )

  if (exists) {
    return
  }
  const gsPath = await runtime.packageFinder.attemptResolve('google-spreadsheet')
  await runtime.fsx.mkdirpAsync(runtime.resolve('src', 'deps'))
  await runtime.fsx.copyAsync(gsPath, runtime.resolve('src', 'deps', 'google-spreadsheet.js'))
}

main()
