const runtime = require('@skypager/node')
const { print } = runtime.cli
const { writeFileAsync: write, mkdirpAsync: mkdir } = runtime.fsx
const { spawn, exec } = runtime.proc.async

main()

async function main() {
  // print('Refreshing Project Metadata')
  // await refreshProjectMetadata()
  print('Prettifying Code')
  await prettifyAll()
}

async function prettifyAll() {
  await spawn('prettier', '--write scripts/* src/**/*.js'.split(' '), { stdio: 'inherit' })
  return true
}
async function refreshProjectMetadata() {
  await mkdir(runtime.resolve('meta'))
  await saveOutput(`lerna ls --json`, 'meta/lerna-packages.json')
  await saveOutput(`lerna updated --json`, 'meta/lerna-updates.json', {
    ignoreError: true,
  })
}

async function saveOutput(command, file, options = {}) {
  try {
    const { stdout: output } = await exec(command, options)
    await write(runtime.resolve(file), output)
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`Error running ${command}`)
      throw error
    }
  }
}
