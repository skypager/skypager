import { Feature } from '@skypager/runtime'
import { google as g } from 'googleapis'

export const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
]

export class GoogleIntegration extends Feature {
  static shortcut = 'google'
  static isObservable = true
  static isCacheable = true

  static optionTypes = {
    googleProject: 'string',
    serviceAccount: 'string',
    driveVersion: 'string',
    docsVersion: 'string',
  }

  /**
   * Returns an array of objects compatible with creating instances of the GoogleSheet helper
   * provided by @skypager/helpers-sheet.  These objects contain useful metadata about the google spreadsheet,
   * without yet incurring the cost of loading all of the cells.
   *
   * Accepts the same arguments as listFiles, but hard codes the mimeType to the google-apps.spreadsheet
   */
  async listSpreadsheets(options = {}) {
    const drive = options.auth ? this.service('drive', { auth: options.auth }) : this.drive
    const { maxResults = 100, sharedWithMe = true } = options

    let query = "trashed=false and mimeType='application/vnd.google-apps.spreadsheet'"

    if (sharedWithMe) {
      query = `${query} and sharedWithMe`
    }

    if (typeof options.query === 'string') {
      query = `and (${options.query})`
    }

    const teamDriveOptions =
      options.teamDriveOptions ||
      (options.teamDrives !== false
        ? { supportsTeamDrives: true, includeTeamDriveItems: true }
        : {})

    const files = await drive.files
      .list({ 
        maxResults, 
        q: query, 
        ...teamDriveOptions 
      })
      .then(r => r.data)

    const { pick } = this.lodash

    const records = files.items.map(i => ({
      ...pick(i, 'id', 'title', 'modifiedDate', 'lastModifyingUserName'),
      sheetId: i.id,
      ...{ getDriveFile: () => i },
    }))

    return records
  }

  /**
   * Lists all files with the google apps folder mime type.
   */
  async listFolders(options = {}) {
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
  async listFiles(options = {}) {
    const drive = options.auth 
      ? this.service('drive', { auth: options.auth })    
      : this.drive

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
      (options.teamDrives !== false
        ? { supportsTeamDrives: true, includeTeamDriveItems: true }
        : {})

    const response = await drive.files.list({
      maxResults,
      q: query,
      ...teamDriveOptions,
    })

    if (options.handleResponse) {
      return response
    }

    let files = response.data.items || response.data.files || []

    if (mimeType && mimeType.length) {
      files = files.filter(i => String(i.mimeType).toLowerCase() === mimeType.toLowerCase())
    }

    return files
  }

  async listDocuments(options = {}) {
    const { pick } = this.lodash
    const { parents = [], recursive = false } = options
    const { docs } = this

    if (recursive) {
      const folders = await this.listFolders({
        ...options.auth && { auth: options.auth }
      })
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
      ...pick(i, 'id', 'title', 'modifiedDate', 'lastModifyingUserName', 'owners'),
      documentId: i.id,
      ...{
        getDocument: () => docs.documents.get({ documentId: i.id }).then(resp => resp.data),
        getDriveFile: () => i,
      },
    }))

    return records
  }
  /**
   * The initial state of the google integration can be passed as options when creating the feature
   * e.g runtime.feature('google', { driveVersion: 'v3' }) and certain flags can be set by the
   * node script's process.argv --flags e.g. --drive-version=v3 --google-project=your-project-id
   *
   * the state's settings object is used for configuring the version numbers of various services to use,
   * as well as for providing the server to server auth credentials in the form of a path to a service account JSON.
   *
   * This is a standard hook function in the Skypager Helper class, and is used to set the initial value of the mobx
   * observable state object.
   */
  initialState() {
    const { pick } = this.lodash

    return {
      googleReady: false,
      googleError: false,
      settings: {
        scopes: DEFAULT_SCOPES,
        ...pick(
          this.runtime.argv,
          'googleProject',
          'serviceAccount',
          'driveVersion',
          'docsVersion'
        ),
        ...pick(
          this.options,
          'googleProject',
          'serviceAccount',
          'driveVersion',
          'docsVersion',
          'versions',
          'scopes'
        ),
        ...(this.options.settings || {}),
      },
    }
  }

  /**
   * Returns a map of specific versions to use of a google api.
   * Drive is hard coded to v2 for compatibility with the @skypager/helpers-sheet and @skypager/helpers-google-doc libraries.
   * Anything not specified will be v1
   */
  get versions() {
    return {
      drive: this.settings.driveVersion || 'v2',
      sheets: this.settings.sheetsVersion || 'v4',
      ...this.settings.versions,
    }
  }

  /**
   * The settings are used for authentication and version selection.  Settings will be injected
   * when the feature is enabled, or based on how the feature is initialized when it is created.
   * Some settings can be picked up from the node.js process.argv --flags
   */
  get settings() {
    const { uniq, pick } = this.lodash
    const settings = this.state.get('settings') || {}
    const merged = {
      ...this.featureSettings,
      ...settings,
      versions: {
        drive: 'v2',
        ...(this.options.versions || {}),
        ...(settings.versions || {}),
        ...(this.featureSettings.versions || {}),
      },
      scopes: uniq([
        ...(settings.scopes || []),
        ...(this.options.scopes || []),
        ...(this.featureSettings.scopes || []),
      ]),
    }

    return pick(
      merged,
      'serviceAccount',
      'googleProject',
      'driveVersion',
      'docsVersion',
      'scopes',
      'versions'
    )
  }

  get serviceAccountEmail() {
    return this.state.get('serviceAccountEmail')
  }

  get serviceAccountClientId() {
    return this.state.get('serviceAccountClientId')
  }

  /**
   * Returns the version number of the google service you want to interact with.
   *
   * drive is defaulted to v2 for example.
   */
  serviceVersion(apiName) {
    return this.versions[apiName] || 'v1'
  }

  /**
   * Creates an axios client for interacting with the google apis for the given apiName
   *
   * @param {String} apiName the name of the google api, e.g. drive
   * @param {Object} options optons to pass
   * @param {Object} [options.auth=this.auth] the authenticated client to call on behalf of
   * @param {String} [options.version='v1'] the version of the service you want to interact with
   *
   * @returns {Object}
   */
  service(apiName, options = {}) {
    const { auth = this.auth } = options
    const svc = g[apiName]

    if (!options.version) {
      options.version = this.serviceVersion(apiName)
    }

    return svc({ auth, ...options })
  }

  /**
   * Returns all of the googleapis from their node.js sdk
   */
  get apis() {
    return g
  }

  /**
   * Returns an axios client for talking to the google drive service.
   * defaults to v2 of that api.
   */
  get drive() {
    const { driveVersion = this.serviceVersion('drive') } = this.settings
    return this.service('drive', {
      version: driveVersion,
    })
  }

  /**
   * Returns an axios client for talking to the google sheets api.
   * defaults to v1 of that api.
   */
  get sheets() {
    const { sheetsVersion = this.serviceVersion('sheets') } = this.settings
    return this.service('sheets', {
      version: sheetsVersion,
    })
  }

  /**
   * Returns an axios client for talking to the google docs api.
   * defaults to v1 of that api.
   */
  get docs() {
    const { docsVersion = this.serviceVersion('docs') } = this.settings
    return this.service('docs', {
      version: docsVersion,
    })
  }

  /**
   * Returns true if there are errors initializing the google api client.
   * Errors are usually related to authentication and service account credentials.
   */
  get hasErrors() {
    return !!this.state.get('googleError')
  }

  /**
   * Returns a promise which will resolve when the google api client has its authentication
   * setup and ready to go.
   *
   * @returns {Promise}
   */
  whenReady() {
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

  async createSpreadsheet(options = {}) {
    if (typeof options === 'string') {
      options = { title: options, auth: this.oauthClient }
    }

    const { auth = this.oauthClient } = options
    const { title } = options

    if (!auth) {
      throw new Error(`This request requires an oauth client.`)
    }

    const response = await this.sheets.spreadsheets.create({
      auth,
      resource: {
        properties: { title },
      },
    })

    return response.data
  }
  /**
   * This lifecycle hook of the Skypager Feature class will get called when
   * the runtime says runtime.feature('google').enable().  By the time this is called,
   * the feature will expect to know where to find the service account JSON on disk,
   * and which google project you expect to be talking to.
   */
  async featureWasEnabled(options = {}) {
    const { settings } = this

    const googleProject =
      options.googleProject ||
      options.projectId ||
      settings.googleProject ||
      settings.projectId ||
      process.env.GCLOUD_PROJECT
    const serviceAccount =
      options.serviceAccount ||
      settings.serviceAccount ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    const credentials = options.credentials || settings.credentials
    const scopes = options.scopes || settings.scopes || DEFAULT_SCOPES

    this.state.set('settings', {
      ...settings,
      scopes,
      googleProject,
      serviceAccount,
      credentials,
    })

    try {
      await this.initializeGoogleAPI()
    } catch (error) {
      this.runtime.error(`Error initializing google API`, error)
    }
  }

  /**
   * Initializes the google API client and caches the authenticated client on this.auth
   *
   * @param {Object} options
   * @param {String} [options.serviceAccount=process.env.GOOGLE_APPLICATION_CREDENTIALS] the path to the service account
   * @param {String} [options.googleProject=process.env.GCLOUD_PROJECT] he google project you're talking to
   */
  async initializeGoogleAPI(options = {}) {
    let {
      googleProject = process.env.GCLOUD_PROJECT,
      serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS,
    } = {
      ...this.settings,
      ...options,
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

    const serviceAccountData = await this.runtime.fsx.readJsonAsync(serviceAccount).catch(e => {})

    if (serviceAccountData && serviceAccountData.client_email) {
      this.state.set('serviceAccountEmail', serviceAccountData.client_email)
      this.state.set('serviceAccountClientId', serviceAccountData.client_id)
    }

    googleProject = googleProject || serviceAccountData.project_id

    if (!googleProject) {
      const e = new Error(
        `Missing GCLOUD_PROJECT please specify it as an environment variable, or with the --google-project command line flag`
      )
      console.error(e)
      this.state.set('googleProjectError', e.message)
      this.state.set('googleError', true)
      this.emit('googleFailed', e)
    }

    // These values need to be set for the node.js sdk to work
    process.env.GCLOUD_PROJECT = googleProject
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccount

    try {
      await this.createAuthClient({ cache: true })
    } catch (error) {
      console.error(error)
    }

    this.state.set('googleReady', true)
    this.emit('googleIsReady', this)
  }

  async requestToken(options = {}) {
    const { client = this.createOAuthClient(options), code } = options

    const token = await new Promise((resolve, reject) => {
      client.getToken(code, (err, result) => (err ? reject(err) : resolve(result)))
    })

    client.setCredentials(token)

    return token
  }

  generateOAuthAccessURL(options = {}) {
    const client = options.client || this.createOAuthClient(options)

    const url = client.generateAuthUrl({
      access_type: options.accessType || 'offline',
      scope: options.scopes || this.settings.scopes,
    })

    return url
  }

  createOAuthClient(options = {}) {
    if (this.oauthClient && !options.fresh) {
      return this.oauthClient
    }

    const { mapKeys } = this.lodash
    const { camelCase } = this.runtime.stringUtils

    options = {
      ...this.settings,
      ...options,
    }

    if (typeof options.credentials === 'string') {
      const pathToCredentials = this.runtime.resolve(options.credentials)
      const exists = this.runtime.fsx.existsSync(pathToCredentials)

      if (!exists) {
        throw new Error(`Credentials JSON not found at ${pathToCredentials}`)
      }

      const credentialsJson = this.runtime.fsx.readJsonSync(pathToCredentials)
      // not sure where these values come from, i've seen both in the credentials i've downloaded
      const values =
        credentialsJson.installed || credentialsJson.web || Object.values(credentialsJson)[0]

      if (
        typeof values !== 'object' ||
        !(values.client_id && values.client_secret && values.redirect_uris)
      ) {
        throw new Error(
          `Invalid credentials JSON. Expected an object with client_id, client_secret, redirect_uris`
        )
      }

      options = {
        ...mapKeys(values, (v, k) => camelCase(k)),
        ...options,
      }
    }

    const { clientId, clientSecret, redirectUris = [] } = {
      ...options,
    }

    if (!clientId || !clientSecret || !redirectUris) {
      throw new Error(`Must pass clientId, clientSecret, redirectUris`)
    }

    const oauthClient = new g.auth.OAuth2(clientId, clientSecret, redirectUris[0])

    if (
      typeof options.accessToken === 'string' &&
      this.runtime.fsx.existsSync(this.runtime.resolve(options.accessToken))
    ) {
      const accessToken = this.runtime.fsx.readJsonSync(this.runtime.resolve(options.accessToken))
      oauthClient.setCredentials(accessToken)
    } else if (typeof options.accessToken === 'object') {
      oauthClient.setCredentials(options.accessToken)
    }

    if (options.cache !== false) {
      this.hide('oauthClient', oauthClient)
    }

    if (options.default) {
      g.options({ auth: oauthClient })
    }

    return oauthClient
  }

  /**
   * Creates an auth client for interacting with google's API.  Must pass an array of scopes,
   * we will ensure at least DEFAULT_SCOPES are requested to be able to work with drive and sheets as we do.
   */
  async createAuthClient(options = {}) {
    if (this.auth && !options.fresh) {
      return this.auth
    }

    const { omit, uniq } = this.lodash

    const scopes = uniq([
      ...DEFAULT_SCOPES,
      ...(this.settings.scopes || []),
      ...(options.scopes || []),
    ])

    const auth = await g.auth.getClient({ ...omit(options, 'fresh', 'cache', 'default'), scopes })

    if (options.cache) {
      this.hide('auth', auth)
    }

    if (options.default) {
      g.options({ auth })
    }

    return auth
  }
}

export default GoogleIntegration
