const runtime = require('@skypager/node')
const googleIntegration = require('..')

function setup() {
  if (runtime.google) {
    return runtime.google
  }

  const serviceAccount =
    runtime.argv.serviceAccount ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    runtime.resolve('secrets', 'serviceAccount.json')
  
  if (!runtime.fsx.existsSync(serviceAccount)) {
    console.error('Expected to find a service account JSON file.')
    console.error(
      `Checked at ${serviceAccount}.  Provide the path via --service-account flag or by setting process.env.GOOGLE_APPLICATION_CREDENTIALS`
    )
    process.exit(1)
  }
  
  runtime.use(googleIntegration, {
    serviceAccount,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    googleProject:
      runtime.argv.projectId ||
      runtime.argv.googleProject ||
      process.env.GCLOUD_PROJECT ||
      runtime.fsx.readJsonSync(serviceAccount).project_id,
  })
}

main()

async function main() {
  const subcommand = runtime.argv._.join(' ')

  switch(subcommand) {
    case 'authorize':
      await authorize()
      break;
    case 'list calendars':
      await listCalendars()
    case 'list folders':
      await listFolders()     
    default:
      displayHelp()
  }
}

async function listFolders() {
  const client = await authorize()

  runtime.google.hide('auth', client)

  const response = await runtime.google.listFolders()

  console.log(response)
}

async function listCalendars() {
  const client = await authorize()
  const calendars = runtime.google.service('calendar', { version: 'v3', auth: client })

  const response = await calendars.events.list({
    calendarId: 'primary'
  })

  console.log(response.data)
}

async function authorize() {
  setup()

  /** @type {import("../src/GoogleIntegration").GoogleIntegration} */
  const google = runtime.google

  const oauthClient = google.createOAuthClient({ credentials: runtime.resolve('secrets', 'clientCredentials.json') })

  const exists = await runtime.fsx.existsAsync(
    runtime.resolve('secrets', 'accessToken.json')
  )

  if (exists) {
    const token = await runtime.fsx.readJsonAsync(
      runtime.resolve('secrets', 'accessToken.json')
    )
    oauthClient.setCredentials(token)
    return oauthClient
  }


  const oauthUrl = google.generateOAuthAccessURL({
    client: oauthClient
  })

  runtime.opener.openInBrowser(oauthUrl)

  runtime.cli.clear()
  runtime.cli.print(`Opening your browser to ${oauthUrl}.\nCopy and paste that token when ready.`, 0, 0, 4)
  const { code } = await runtime.cli.ask({
    code: {
      description: 'Paste the code:'
    }
  })

  const token = await google.requestToken({ code, client: oauthClient })

  await runtime.fsx.writeFileAsync(
    runtime.resolve('secrets', 'accessToken.json'),
    JSON.stringify(token, null, 2)
  )

  return oauthClient 
}

function displayHelp(subcommand = false) {

}