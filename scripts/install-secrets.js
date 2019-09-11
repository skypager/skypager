const { writeFileSync, mkdirpSync } = require('fs-extra-promise')
const { resolve } = require('path')
const serviceAccountJson = process.env.SERVICE_ACCOUNT_DATA

const src = resolve(__dirname, '..', 'src')

mkdirpSync(resolve(src, 'features', 'google', 'secrets'))
mkdirpSync(resolve(src, 'helpers', 'google-sheet', 'secrets'))
mkdirpSync(resolve(src, 'helpers', 'google-doc', 'secrets'))
mkdirpSync(resolve(src, 'examples', 'sheet-server', 'secrets'))

writeFileSync(
  resolve(src, 'features', 'google', 'secrets', 'serviceAccount.json'),
  serviceAccountJson,
  'utf8'
)
writeFileSync(
  resolve(src, 'helpers', 'google-sheet', 'secrets', 'serviceAccount.json'),
  serviceAccountJson,
  'utf8'
)
writeFileSync(
  resolve(src, 'helpers', 'google-doc', 'secrets', 'serviceAccount.json'),
  serviceAccountJson,
  'utf8'
)
writeFileSync(
  resolve(src, 'examples', 'sheet-server', 'secrets', 'serviceAccount.json'),
  serviceAccountJson,
  'utf8'
)
