export const interfaceMethods = ['loadModuleGraph', 'loadPackageGraph']

export function loadModuleGraph(query = {}) {
  return this.client.get(`/module-graph`, { query }).then(r => r.data)
}

export function loadPackageGraph(query = {}) {
  return this.client.get(`/package-graph`, { query }).then(r => r.data.graph)
}
