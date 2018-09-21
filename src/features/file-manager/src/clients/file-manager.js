export const interfaceMethods = ['ls']

export async function ls(path, options = {}) {
  return this.client.get(`/api/file-manager/${path}`, { query: options }).then(r => r.data)
}
