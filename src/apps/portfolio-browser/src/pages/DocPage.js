import React, { Component } from 'react'
import types from 'prop-types'
import { Skypage } from '@skypager/helpers-document'

export default class DocPage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  render() {
    console.log(this.props.match, this.props)
    const index = this.context.runtime.mdxDoc('index')

    return <Skypage doc={index} />
  }
}
