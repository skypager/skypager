import runtime from '@skypager/node'
import * as GoogleIntegration from '../src'

const { clear, print } = runtime.cli

runtime.use(GoogleIntegration, {
  googleProject: require(runtime.resolve('secrets', 'serviceAccount.json')).project_id,
  serviceAccount: runtime.resolve('secrets', 'serviceAccount.json'),
  credentials: runtime.resolve('secrets', 'clientCredentials.json'),
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
})

async function main() {
  /** @type {import("../src/GoogleIntegration").GoogleIntegration} */
  const google = runtime.google

  clear()
  await google.whenReady()
  print('Google Integration Is Ready')

  const oauthURL = google.generateOAuthAccessURL({
    credentials: runtime.resolve('secrets', 'clientCredentials.json'),
  })

  const code = '4/dQGv_NjNuOPxSLJ8O-9QDZaRDXoM1pQI7Di4LHN_8_Ss_y2cMpScDvI'

  const token = await google.requestToken({ code })

  console.log(token)
}

main()
