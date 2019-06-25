import { google as g } from 'googleapis'

export const shortcut = 'google'

export const isObservable = true

export const initialState = {
  googleReady: false,
  googleError: false,
}

export const featureMethods = [
  'createAuthClient',
  'listSpreadsheets',
  'listDocuments',
  'listFiles',
  'listFolders',
  'getDrive',
  'getDocs',
  'whenReady',
  'getHasErrors',
  'getApis',
  'service',
]

export function getApis() {
  return g
}

export function service(apiName, options = {}) {
  const { auth } = this
  const svc = g[apiName]

  if (!options.version) {
    options.version = apiName === 'drive' ? 'v2' : 'v1'
  }

  return svc({ auth, ...options })
}

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

  const teamDriveOptions =
    options.teamDriveOptions ||
    (options.teamDrives !== false ? { supportsTeamDrives: true, includeTeamDriveItems: true } : {})

  const files = await drive.files
    .list({ maxResults, q: query, ...teamDriveOptions })
    .then(r => r.data)

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

export function getDrive() {
  const { driveVersion = 'v2' } = this.settings
  return this.service('drive', {
    version: driveVersion,
  })
}

export function getDocs() {
  return this.service('docs')
}

export async function listFolders(options = {}) {
  return this.listFiles({
    ...options,
    mimeType: 'application/vnd.google-apps.folder',
  })
}

/**
 * Returns a list of file objects from the google drive files API.  Is a convenience wrapper for constructing
 * the query syntax more easily. See https://developers.google.com/drive/api/v3/search-files for the exact parameters.
 *
 * @param {Object} options
 * @param {Number} [options.maxResults=100] the maximum number of results to show
 * @param {Boolean} [options.sharedWithMe=true] return files that are shared with you, in addition to ones you own
 * @param {Boolean} [options.teamDrives=true] return files that are shared with you in team drives, in addition to ones you own
 * @param {Boolean} [options.handleResponse=false] useful for debugging purposes to see the full axios response object from google's rest API
 * @param {Object} [options.teamDriveOptions] specify your own team drive options
 * @param {Boolean} [options.trashed=false] include trashed files in the results
 * @param {String} [options.parentsOperator='and'] which operator to use when using the parents parameter
 * @param {Array} [options.parents=[]] parent folder ids to search
 * @param {String} [options.mimeType] limit the search by mimeType, useful for finding google docs, vs sheets, folders, etc
 * @param {String} [options.and] an additional query condition that must return match
 * @param {String} [options.or] an additional query condition that can also return match
 */
export async function listFiles(options = {}) {
  const { drive } = this
  const {
    maxResults = 100,
    sharedWithMe = true,
    trashed = false,
    mimeType,
    and,
    or,
    parents = [],
    parentsOperator = 'and',
  } = options

  let query = trashed ? `trashed=true` : `trashed=false`

  if (sharedWithMe) {
    query = `${query} and sharedWithMe`
  }

  if (mimeType) {
    query = `${query} and mimeType='${mimeType}'`
  }

  if (parents && parents.length) {
    const parentConditions = parents.map(id => `'${id}' in parents`)
    query = `${query} ${parentsOperator} (${parentConditions.join(' or ')})`
  }

  if (typeof and === 'string') {
    query = `${query} and ${and}`
  }

  if (typeof or === 'string') {
    query = `${query} or ${or}`
  }

  const teamDriveOptions =
    options.teamDriveOptions ||
    (options.teamDrives !== false ? { supportsTeamDrives: true, includeTeamDriveItems: true } : {})

  const response = await drive.files.list({ maxResults, q: query, ...teamDriveOptions })

  if (options.handleResponse) {
    return response
  }

  let files = response.data.items || response.data.files || []

  if (mimeType && mimeType.length) {
    files = files.filter(i => String(i.mimeType).toLowerCase() === mimeType.toLowerCase())
  }

  return files
}

export async function listDocuments(options = {}) {
  const { pick } = this.lodash
  const { parents = [], recursive = false } = options
  const { docs } = this

  if (recursive) {
    const folders = await this.listFolders()
    const parentIds = folders.map(f => f.id)
    parents.push(...parentIds)
  }

  const files = await this.listFiles({
    parents,
    // finding files in folders that are sharedWithMe
    parentsOperator: 'or',
    ...options,
    mimeType: 'application/vnd.google-apps.document',
  })

  const records = files.map(i => ({
    ...pick(i, 'id', 'title', 'modifiedDate', 'lastModifyingUserName'),
    documentId: i.id,
    ...{
      getDocument: () => docs.documents.get({ documentId: i.id }).then(resp => resp.data),
      getDriveFile: () => i,
    },
  }))

  return records
}
