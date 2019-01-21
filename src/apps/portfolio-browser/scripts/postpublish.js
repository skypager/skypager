const { spawnSync } = require('child_process')
const { resolve } = require('path')

const result = spawnSync('yarn', ['deploy'], {
  stdio: 'inherit',
  cwd: resolve(__dirname, '..'),
})

process.exit(result.status)
