const runtime = require('@skypager/node')
const serviceAccountPath = runtime.resolve('secrets', 'serviceAccount.json')

async function main() {
  if (runtime.argv.build) {
    await runtime.proc.async.spawn('yarn', ['build'])
  }

  runtime.use(require('../lib'), {
    serviceAccount: serviceAccountPath,
    googleProject: require(serviceAccountPath).project_id,
  })

  await runtime.sheets.discover()

  const sheet = runtime.sheet(runtime.sheets.available[0])

  await sheet.loadAll()

  const ws = sheet.sheet('sheet2')

  runtime.repl('interactive').launch({
    runtime,
    sheet,
    ws,
  })
}

main()
