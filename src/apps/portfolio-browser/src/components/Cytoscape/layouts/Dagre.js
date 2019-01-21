export const dependencies = [
  ['dagre', 'dagre@0.8.4/dist/dagre.min.js'],
  ['cytoscapeDagre', 'cytoscape-dagre@2.2.2/cytoscape-dagre.js'],
]

export const Dagre = {
  name: 'dagre',
}

export function attach({ cytoscape, cytoscapeDagre, dagre }) {
  console.log({ dagre, cytoscapeDagre })
  return cytoscape.use(cytoscapeDagre)
}

export const fields = [
  {
    name: 'animate',
    type: 'Checkbox',
    label: 'Animate',
  },
  {
    name: 'padding',
    type: 'Slider',
    label: 'Scene Padding',
  },
  {
    name: 'edgeSep',
    type: 'Slider',
    label: 'Edge Separation',
  },
  {
    name: 'rankSep',
    type: 'Slider',
    label: 'Rank Separation',
  },
  {
    label: 'Rank Direction',
    name: 'rankDir',
    type: 'Dropdown',
    options: [
      {
        value: 'TB',
        text: 'Vertical',
      },
      {
        value: 'LR',
        text: 'Horizontal',
      },
    ],
  },
  {
    name: 'ranker',
    label: 'Rank Algorithm',
    type: 'Dropdown',
    options: [
      {
        value: 'network-simplex',
        text: 'Network Simplex',
      },
      {
        value: 'tight-tree',
        text: 'Tight Tree',
      },
      {
        value: 'longest-path',
        text: 'Longest Path',
      },
    ],
  },
]

export const defaults = {
  // dagre algo options, uses default value on undefined
  nodeSep: undefined, // the separation between adjacent nodes in the same rank
  edgeSep: undefined, // the separation between adjacent edges in the same rank
  rankSep: undefined, // the separation between adjacent nodes in the same rank
  rankDir: undefined, // 'TB' for top to bottom flow, 'LR' for left to right,
  ranker: undefined, // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
  minLen: function(edge) {
    return 1
  }, // number of ranks to keep between the source and target of the edge
  edgeWeight: function(edge) {
    return 1
  }, // higher weight edges are generally made shorter and straighter than lower weight edges

  // general layout options
  fit: true, // whether to fit to viewport
  padding: 30, // fit padding
  spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
  nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
  animate: false, // whether to transition the node positions
  animateFilter: function(node, i) {
    return true
  }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
  animationDuration: 500, // duration of animation in ms if enabled
  animationEasing: undefined, // easing of animation if enabled
  boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  transform: function(node, pos) {
    return pos
  }, // a function that applies a transform to the final node position
  ready: function() {}, // on layoutready
  stop: function() {}, // on layoutstop
}
