const runtime = require('@skypager/node').use(require('..'))
const google = runtime.feature('google')
const { google: g } = require('googleapis')

async function main() {
  const auth = await google.createAuthClient()
  const drive = g.drive({ version: 'v2', auth })
  const files = await drive.files.list({
    maxResults: 100,
    q: 'trashed=false and sharedWithMe',
  })

  console.log(files)
}

main()
