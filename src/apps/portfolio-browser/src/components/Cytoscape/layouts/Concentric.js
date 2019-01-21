export const Concentric = {
  name: 'concentric',
  avoidOverlap: false,
  minNodeSpacing: 30,
  concentric: function(node) {
    return node.degree()
  },
  levelWidth: function(nodes) {
    return 2
  },
}
