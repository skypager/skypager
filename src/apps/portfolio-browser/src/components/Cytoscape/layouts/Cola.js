export const dependencies = [
  ['cola', 'webcola/WebCola/cola.min.js'],
  ['cytoscapeCola', 'cytoscape-cola@2.3.0/cytoscape-cola.js'],
]

export const Cola = {
  name: 'cola',
  nodeSpacing: 30,
}

let attached
export function attach({ cytoscape, cytoscapeCola, cola }) {
  if (attached) {
    return
  }
  attached = true

  if (cola) {
    global.cola = window.cola = cola
  }

  cytoscape.use(cytoscapeCola)
}
