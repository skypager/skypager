import React, { Component } from 'react'
import types from 'prop-types'
import DocPage from './DocPage'

export default class HomePage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  render() {
    return (
      <DocPage docId="README" />
    )
  }
}
