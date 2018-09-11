// We should be able to generate a build without this snippet for the react-native
// where dynamic requires will generate build errors
module.exports = function(expression) {
  if (typeof __non_webpack_require__ === 'function') {
    // return __non_webpack_require__(expression)
  }
}