const runtime = require('@skypager/node')
const googleIntegration = require('../..')

module.exports = function setup(options = {}) {
  if (runtime.google) {
    return runtime.google
  }

  const {
    serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      runtime.resolve('secrets', 'serviceAccount.json'),
    credentials = runtime.resolve('secrets', 'clientCredentials.json'),
    googleProject = options.projectId ||
      process.env.GCLOUD_PROJECT ||
      runtime.fsx.readJsonSync(serviceAccount).project_id,
  } = options

  if (!runtime.fsx.existsSync(credentials)) {
    console.error('Expected to find a credentials JSON file.')
    console.error(`Checked at ${credentials}.  Provide the path via --credentials flag`)
    process.exit(1)
  }

  if (!runtime.fsx.existsSync(serviceAccount)) {
    console.error('Expected to find a service account JSON file.')
    console.error(
      `Checked at ${serviceAccount}.  Provide the path via --service-account flag or by setting process.env.GOOGLE_APPLICATION_CREDENTIALS`
    )
    process.exit(1)
  }

  runtime.use(googleIntegration, {
    serviceAccount,
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
    googleProject,
  })

  /**
   * @type {import("../..").GoogleIntegration}
   */
  const google = runtime.google

  return google
}
