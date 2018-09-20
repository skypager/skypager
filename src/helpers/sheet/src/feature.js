import { google as g } from 'googleapis'

export const shortcut = 'google'

export const isObservable = true

export const initialState = {
  googleReady: false,
  googleError: false,
}

export const featureMethods = ['createAuthClient', 'listSpreadsheets', 'whenReady', 'getHasErrors']

export function getHasErrors() {
  return !!this.state.get('googleErrors')
}

export function whenReady() {
  return new Promise((resolve, reject) => {
    if (this.hasErrors) {
      reject(new Error(`The Google Integration failed`))
    } else if (this.state.get('googleReady')) {
      resolve(this)
    } else {
      const dispose = this.state.observe(update => {
        if (update.name === 'googleError' && update.newValue) {
          reject(new Error('The Google Integration failed'))
        } else if (update.name === 'googleReady' && update.newValue) {
          dispose()
          resolve(this)
        }
      })
    }
  })
}

export async function featureWasEnabled(options = {}) {
  this.hide('settings', {
    googleProject: process.env.GCLOUD_PROJECT,
    serviceAccount:
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      this.runtime.resolve('secrets', 'serviceAccount.json'),
    ...this.runtime.argv,
    ...this.options,
    ...options,
  })

  const { googleProject, serviceAccount } = this.settings

  // need to look into how i can supply these values at rutime
  process.env.GCLOUD_PROJECT = googleProject
  process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccount

  if (!googleProject) {
    const e = new Error(
      `Missing GCLOUD_PROJECT please specify it as an environment variable, or with the --google-project command line flag`
    )
    console.error(e)
    this.state.set('googleProjectError', e.message)
    this.state.set('googleError', true)
    this.emit('googleFailed', e)
  }

  if (!serviceAccount) {
    const e = new Error(
      `Missing GOOGLE_APPLICATION_CREDENTIALS. Please specify the path to your service account json file as an environment variable, or by using the --service-account command line flag`
    )
    console.error(e)
    this.state.set('googleCredentialsError', e.message)
    this.state.set('googleError', true)
    this.emit('googleFailed', e)
  }

  const serviceAccountExists = await this.runtime.fsx.existsAsync(serviceAccount)

  if (!serviceAccountExists) {
    const e = new Error(`Could not find service account json at ${serviceAccount}`)
    console.error(e)
    this.state.set('googleCredentialsError', e.message)
    this.state.set('googleError', true)
    this.emit('googleFailed', e)
  }

  const auth = await this.createAuthClient()
  this.hide('auth', auth)
  this.state.set('googleReady', true)
  this.emit('googleIsReady', this)
}

export async function listSpreadsheets(runtime, options = {}) {
  const { maxResults = 100, sharedWithMe = true, auth: authOptions = {} } = options

  const auth = await this.createAuthClient(authOptions)
  const drive = g.drive({ version: 'v2', auth })

  let query = "trashed=false and mimeType='application/vnd.google-apps.spreadsheet'"

  if (sharedWithMe) {
    query = `${query} and sharedWithMe`
  }

  if (typeof options.query === 'string') {
    query = `and (${options.query})`
  }

  const files = await drive.files.list({ maxResults, q: query }).then(r => r.data)

  const { pick } = this.lodash

  const records = files.items.map(i => ({
    ...pick(i, 'id', 'title', 'modifiedDate', 'lastModifyingUserName'),
    sheetId: i.id,
    ...{ getDriveFile: () => i },
  }))

  return records
}

export async function createAuthClient(options = {}) {
  const {
    scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
  } = options

  const { google } = require('googleapis')

  return google.auth.getClient({ scopes })
}
