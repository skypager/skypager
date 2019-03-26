export const interfaceMethods = [
  'authorize',
  'fetchPackageInfo',
  'search',
  'fetchPackageVersionInfo',
  'searchByMaintainer',
  'searchByKeywords',
]

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

export async function searchByKeywords(keywords = [], options = {}) {
  const { isArray } = this.lodash

  const query = isArray(keywords) ? keywords.map(k => k.trim()).join(',') : String(keywords).trim()

  if (options.text) {
    options.text = `${options.text} keywords:${query}`.trim()
  } else {
    options.text = `keywords:${query}`
  }

  return this.search({
    results: true,
    ...options,
  })
}

export async function searchByMaintainer(maintainerName, options = {}) {
  const searchFlag = options.author ? 'author' : 'maintainer'

  if (options.text) {
    options.text = `${options.text} ${searchFlag}:${maintainerName}`.trim()
  } else {
    options.text = `${searchFlag}:${maintainerName}`
  }

  return this.search({
    results: true,
    ...options,
  })
}

/** 
  author:bcoe: Show/filter results in which bcoe is the author
  maintainer:bcoe: Show/filter results in which bcoe is qualifier as a maintainer
  keywords:batman: Show/filter results that have batman in the keywords
  separating multiple keywords with
  , acts like a logical OR
  + acts like a logical AND
  ,- can be used to exclude keywords
  not:unstable: Exclude packages whose version is < 1.0.0
  not:insecure: Exclude packages that are insecure or have vulnerable dependencies (based on the nsp registry)
  is:unstable: Show/filter packages whose version is < 1.0.0
  is:insecure: Show/filter packages that are insecure or have vulnerable dependencies (based on the nsp registry)
  boost-exact:false: Do not boost exact matches, defaults to true
*/
export async function search(options = {}) {
  const { defaults, pick } = this.lodash
  const url = `/-/v1/search`

  const searchParams = ['text', 'size', 'from', 'quality', 'popularity', 'maintenance']

  const params = defaults({}, pick(options, searchParams), {
    size: 250,
  })

  if (typeof options.insecure !== 'undefined') {
    const insecureFlag = options.insecure ? 'is:insecure' : 'not:insecure'
    options.text = `${options.text} ${insecureFlag}`
  }

  if (typeof options.unstable !== 'undefined') {
    const stableFlag = options.unstable ? 'is:unstable' : 'not:unstable'
    options.text = `${options.text} ${stableFlag}`
  }

  if (options.maintainer) {
    options.text = `${options.text} maintainer:${String(options.maintainer).trim()}`
  } else if (options.author) {
    options.text = `${options.text} author:${String(options.author).trim()}`
  }

  if (options.keywords) {
    const { isArray } = this.lodash
    const query = isArray(options.keywords)
      ? options.keywords.map(k => k.trim()).join(',')
      : options.keywords

    options.text = `${options.text} keywords:${query}`
  }

  const response = await this.client.get(url, {
    params,
  })

  if (options.handleResponse) {
    return response
  } else if (options.results) {
    return response.data.objects
  } else {
    return response.data
  }
}

export async function fetchPackageVersionInfo(packageName, version = 'latest', options = {}) {
  const response = await this.client.get(
    `/${encodeURIComponent(packageName)}/${encodeURIComponent(version)}`
  )

  if (options.handleResponse) {
    return response
  } else {
    return response.data
  }
}

export async function fetchPackageInfo(packageName, options = {}) {
  const response = await this.client.get(`/${encodeURIComponent(packageName)}`)

  if (options.handleResponse) {
    return response
  } else {
    return response.data
  }
}
