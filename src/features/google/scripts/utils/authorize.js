const runtime = require('@skypager/node')
const setup = require('./setup')

module.exports = async function authorize(options = {}) {
  await setup()

  /** @type {import("../../src/GoogleIntegration").GoogleIntegration} */
  const google = runtime.google

  const {
    credentials = runtime.resolve('secrets', 'clientCredentials.json'),
    accessToken = runtime.resolve('secrets', 'accessToken.json')
  } = options

  const oauthClient = google.createOAuthClient({
    credentials,
  })

  const exists = await runtime.fsx.existsAsync(accessToken)

  if (exists) {
    const token = await runtime.fsx.readJsonAsync(accessToken)
    oauthClient.setCredentials(token)
    return oauthClient
  }

  const oauthUrl = google.generateOAuthAccessURL({
    client: oauthClient,
  })

  runtime.opener.openInBrowser(oauthUrl)

  runtime.cli.clear()
  runtime.cli.print(
    `Opening your browser to ${oauthUrl}.\nCopy and paste that token when ready.`,
    0,
    0,
    4
  )
  const { code } = await runtime.cli.ask({
    code: {
      description: 'Paste the code:',
    },
  })

  const token = await google.requestToken({ code, client: oauthClient })

  await runtime.fsx.writeFileAsync(
    accessToken,
    JSON.stringify(token, null, 2)
  )

  return oauthClient
}