/**
 * This script publishes the latest versions of the core @skypager scoped dependencies
 * under a single, unscoped dependency package named skypager.  This was the previous package
 * whose development ended at 39.9.2
 *
 */
const { spawnSync } = require('child_process')
const { resolve } = require('path')
const { readFileSync } = require('fs')

const mainRoot = resolve(__dirname, '..', 'src', 'main')
const read = () =>
  JSON.parse(readFileSync(resolve(__dirname, '..', 'src', 'main', 'package.json')).toString())

const sig = deps =>
  Object.keys(deps)
    .sort()
    .map(name => `${name}:${deps[name]}`)
    .join('\n')

const current = read()

spawnSync('yarn', ['build'], {
  cwd: mainRoot,
  stdio: 'inherit',
})

const next = read()

if (sig(next.dependencies) !== sig(current.dependencies)) {
  spawnSync('npm', ['version', 'patch', '--skip-git'], {
    cwd: mainRoot,
    stdio: 'inherit',
  })

  const published = read()
  /*
  spawnSync('npm', ['publish'], {
    cwd: mainRoot,
    stdio: 'inherit',
  })
  */
  spawnSync('git', ['add', 'src', 'main'], {
    cwd: resolve(__dirname, '..'),
  })
  spawnSync('git', ['commit', '-am', `Published skypager ${published.version}`], {
    cwd: resolve(__dirname, '..'),
  })
} else {
  console.log('No changes necessary. Skipping publishing of unscoped skypager package')
}
