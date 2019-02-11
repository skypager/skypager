export const interfaceMethods = ['findDependentsOf']

export async function findDependentsOf(packageName, options = {}) {
  return this.client
    .get(`/api/package-manager/dependenciesOf/${packageName}`, { query: options })
    .then(r => r.data)
}
