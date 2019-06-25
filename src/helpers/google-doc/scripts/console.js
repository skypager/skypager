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

  // await runtime.googleDocs.discover()

  // const doc = runtime.googleDoc(runtime.googleDocs.available[0])

  runtime.repl('interactive').launch({
    runtime,
  })
}

main()
