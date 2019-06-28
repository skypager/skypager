const runtime = require('@skypager/node')
const setup = require('./setup')

const { colors, print, clear, ask } = runtime.cli
const { openInBrowser } = runtime.opener
const { readJsonAsync, writeFileAsync, existsAsync } = runtime.fsx
const { resolve } = runtime

/**
 * @param {Array<string>} subcommands
 * @param {Object} options
 * @param {String} [options.credentials='$CWD/secrets/clientCredentials.json'] path to the oauth2 client credentials JSON
 * @param {String} [options.accessToken='$CWD/secrets/accessToken.json'] path to where the current user's access token JSON will be saved
 * @param {Boolean} [options.refresh=false] pass true to regenerate the access token JSON if it already exists
 * @param {Boolean} [options.server=false] prefer server to server authentication method 
 * @param {Boolean} [options.help=false] show the help screen
 * @param {Boolean} [options.verbose=false] show progress output messages
 */
module.exports = async function authorize(subcommands = [], options = {}) {
  if (subcommands[0] === 'help' || options.help) {
    return help(subcommands, options)
  }

  await setup()

  /** @type {import("../../src/GoogleIntegration").GoogleIntegration} */
  const google = runtime.google

  const {
    credentials = resolve('secrets', 'clientCredentials.json'),
    accessToken = resolve('secrets', 'accessToken.json'),
    server = false
  } = options

  if (server && google.settings.serviceAccount) {
    options.verbose && print(`Using server to server auth: ${google.serviceAccountEmail}`)
    await google.whenReady()
    return
  }

  options.verbose && print('Authorizing oAuth Client.')

  const oauthClient = google.createOAuthClient({
    credentials,
    default: true,
  })

  const exists = await existsAsync(accessToken)

  if (exists && !options.refresh) {
    options.verbose && print(`Stored Access Token found ${colors.green('OK')}`)

    const token = await readJsonAsync(accessToken)
    oauthClient.setCredentials(token)
    return oauthClient
  }

  const oauthUrl = google.generateOAuthAccessURL({
    client: oauthClient,
  })

  openInBrowser(oauthUrl)

  clear()
  print(`Opening your browser to ${oauthUrl}.\nCopy and paste that token when ready.`, 0, 0, 4)
  const { code } = await ask({
    code: {
      description: 'Paste the code:',
    },
  })

  clear()
  print(`Requesting access token.`)
  const token = await google.requestToken({ code, client: oauthClient })

  print(`Saving Access Token to disk for offline use.`)
  await writeFileAsync(accessToken, JSON.stringify(token, null, 2))

  return oauthClient
}

function help(subcommands = [], options = {}) {
  print(colors.bold.underline('Authorize Command'), 0, 1, 1)
  print(`
    The authorize command uses an oAuth2 client's credentials JSON to interact with the google APIs
    on behalf of a google user.  This command will open your web browser to authorize your own oAuth2 application,
    and have you login to do so.  It will display a code, which you must copy and paste into the terminal.

    Doing so will request offline access to the google drive / calendar resources, and save the accessToken and refreshToken
    as JSON so you can run commands with it. 
  `)
  print(colors.bold.underline('Options'), 0, 0, 1)
  print(`
    --refresh               request a new accessToken even if the saved one already exists.
    --access-token <path>   the path to save your access token, defaults to secrets/accessToken.json
    --credentials <path>    the path to the oAuth2 Client Credentials JSON, defaults to secrets/clientCredentials.json
  `)
}
