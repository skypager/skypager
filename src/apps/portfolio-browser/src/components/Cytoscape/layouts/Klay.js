export const dependencies = [
  ['$klay', 'klayjs@0.4.1/klay.js'],
  ['cytoscapeKlay', 'cytoscape-klay@3.1.2/cytoscape-klay.js'],
]

export const Klay = {
  name: 'klay',
}

export function attach({ cytoscape, cytoscapeKlay, $klay }) {
  console.log({ $klay, cytoscapeKlay })
  return cytoscape.use(cytoscapeKlay)
}
