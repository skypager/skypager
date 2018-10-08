const runtime = require('@skypager/node')
const { exec } = runtime.proc.async
const { print } = runtime.cli
const { writeFileAsync: write, mkdirpAsync: mkdir } = runtime.fsx

async function main() {
  print('Saving Updated Package Metadata')
  const { stdout: updated } = await exec(`lerna updated --json`)
  await mkdir(runtime.resolve('tmp'))
  await write(runtime.resolve('tmp', 'updated.json'), updated)
}

main()
