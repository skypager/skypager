const runtime = require('@skypager/node')
const serviceAccountPath = runtime.resolve('secrets', 'serviceAccount.json')

runtime.use(require('../lib'), {
  serviceAccount: serviceAccountPath,
  googleProject: require(serviceAccountPath).project_id,
})

const { print } = runtime.cli

async function main() {
  await runtime.sheets.discover()
  print(runtime.sheets.available)
}

main()
