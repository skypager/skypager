const runtime = require('@skypager/node')
const serviceAccountPath = runtime.resolve('secrets', 'serviceAccount.json')

runtime.use(require('../lib'), {
  serviceAccount: serviceAccountPath,
  googleProject: require(serviceAccountPath).project_id,
})

async function main() {
  await runtime.sheets.discover()
  runtime.repl('interactive').launch({
    runtime,
  })
}

main()
