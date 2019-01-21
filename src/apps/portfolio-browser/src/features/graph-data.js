export const shortcut = 'graphData'

export const featureMethods = ['fetchNodeModuleGraph', 'getClient']

export async function fetchNodeModuleGraph(params = {}) {
  const response = await this.client.loadModuleGraph(params)

  let { edges = [], nodes = [] } = response

  const index = new Map()
  const targets = new Map()
  const sources = new Map()

  nodes.forEach((node, i) => {
    index.set(node.name, node)
  })

  edges.forEach(({ type, target, source }, i) => {
    const s = sources.get(source) || []
    const t = targets.get(target) || []

    if (type === 'dependencies') {
      sources.set(source, s.concat([target]))
    }
    targets.set(target, t.concat([source]))
  })

  return {
    ...response,
    edges,
    nodes,
    index,
    targets,
    sources,
  }
}

export function getClient() {
  return this.runtime.appClient
}
