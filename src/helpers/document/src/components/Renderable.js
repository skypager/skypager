import React, { Component } from 'react'
import types from 'prop-types'

export default class Renderable extends Component {
  static propTypes = {
    Editor: types.func.isRequired
  }  

  render() {
    const { Editor } = this.props
    return (
      <Editor {...this.props} />
    )
  }
}