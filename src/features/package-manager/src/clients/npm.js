export const interfaceMethods = ['fetchPackageInfo', 'authorize']

export function createClient(options = {}) {
  const { npmToken = this.options.npmToken, registry = 'registry.npmjs.org' } = options

  const client = this.axios.create({
    ...this.lodash.omit(options, 'npmToken', 'registry'),
    baseURL: `https://${registry}`,
  })

  if (npmToken && String(npmToken).length) {
    this.authorize(npmToken, client)
  }

  return client
}

export async function authorize(authToken, client = this.client) {
  client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  return this
}

export async function fetchPackageInfo(packageName, options = {}) {
  const response = await this.client.get(`/${encodeURIComponent(packageName)}`)

  if (options.handleResponse) {
    return response
  } else {
    return response.data
  }
}
