import { google as g } from 'googleapis'

export const shortcut = 'google'

export const isObservable = true

export const initialState = {
  googleReady: false,
  googleError: false,
}

export const featureMethods = [
  'createAuthClient',
  'listDocuments',
  'listFiles',
  'listFolders',
  'whenReady',
  'getHasErrors',
  'getApis',
  'service',
  'getDrive',
  'getDocs',
]

export function getApis() {
  return g
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

export function getDrive() {
  return this.service('drive')
}

export function getDocs() {
  return this.service('docs')
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

export function service(apiName, options = {}) {
  const { auth } = this
  const svc = g[apiName]

  if (!options.version) {
    options.version = apiName === 'drive' ? 'v2' : 'v1'
  }

  return svc({ auth, ...options })
}

export async function listFolders(options = {}) {
  return this.listFiles({
    ...options,
    mimeType: 'application/vnd.google-apps.folder',
  })
}

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

  if (parents.length) {
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

  let files = options.handleResponse ? response : response.data.items

  if (mimeType.length) {
    files = files.filter(i => String(i.mimeType).toLowerCase() === mimeType.toLowerCase())
  }

  return files
}

export async function listDocuments(options = {}) {
  const { pick, omit } = this.lodash
  const { parents = [], recursive = false } = options

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

export function createAuthClient(options = {}) {
  const {
    scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
  } = options

  const { google } = require('googleapis')

  return google.auth.getClient({ scopes })
}