export const dependencies = [
  ['cytoscapeCoseBilkent', 'cytoscape-cose-bilkent@4.0.0/cytoscape-cose-bilkent.js'],
]

export const CoseBilkent = {
  name: 'cose-bilkent',
  padding: 30,
}

export function attach({ cytoscape, cytoscapeCoseBilkent }) {
  return cytoscape.use(cytoscapeCoseBilkent)
}
