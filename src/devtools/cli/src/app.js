import React, { Component } from 'react'
import { render } from 'ink'
import types from 'prop-types'
import runtime from '@skypager/node'
import FontPreview from './screens/FontPreview'

function App({ runtime }) {
  return <FontPreview runtime={runtime} />
}

App.propTypes = {
  runtime: types.object,
}

App.defaultProps = {
  runtime,
}

module.exports = (options = {}, runtimeInstance = runtime) =>
  render(<App runtime={runtimeInstance} />, options)
