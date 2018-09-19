export const shortcut = 'google'

export const featureMethods = ['createAuthClient']

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
