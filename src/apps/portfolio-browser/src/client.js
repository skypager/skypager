export const interfaceMethods = ['loadModuleGraph', 'loadPackageGraph']

export function getBaseURL() {
  return `https://graph-explorer.skypager.io`
}
export function loadModuleGraph(query = {}) {
  return this.client
    .get(`https://graph-explorer.skypager.io/module-graph.json`, { query })
    .then(r => r.data)
}

export function loadPackageGraph(query = {}) {
  return this.client
    .get(`https://graph-explorer.skypager.io/package-graph.json`, { query })
    .then(r => r.data.graph)
}
