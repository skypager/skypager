export const interfaceMethods = ['processSnippet', 'processMdx', 'listFiles']

export function getBaseUrl() {
  return `https://doc-helper.skypager.io`
}

export function processSnippet(options = {}) {
  return this.client.post(`/vm`, options).then(r => r.data)
}

export async function processMdx(options = {}) {
  if (options.file && !options.content) {
    await this.listFiles(options.file).then(({ path, content }) => {
      options.content = content
      options.filename = path
    })  
  }

  return this.client.post(`/mdx`, options).then(r => r.data)
}

export function listFiles(pathId='') {
  pathId = pathId.length
    ? `/${pathId}`.replace(/\/\//g,'/')
    : ''

  return this.client.get(`/api/file-manager${pathId}`).then((r) => r.data)
}
