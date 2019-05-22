export const interfaceMethods = ['processSnippet', 'processMdx']

export function getBaseUrl() {
  return `https://doc-helper.skypager.io`
}

export function processSnippet(options = {}) {
  return this.client.post(`${getBaseUrl()}/vm`, options).then(r => r.data)
}

export function processMdx(options = {}) {
  return this.client.post(`${getBaseUrl()}/mdx`, options).then(r => r.data)
}
