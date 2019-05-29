import React, { Component } from 'react'
import types from 'prop-types'
import BlockRenderer from './BlockRenderer'

export default class Renderable extends Component {
  static propTypes = {
    Editor: types.func.isRequired,
  }

  render() {
    const { hideEditor = false, position = 'below', Editor } = this.props

    const doc = this.props.doc ? this.props.doc : this.props.getDocument && this.props.getDocument()

    if (!doc) {
      return <Editor {...this.props} />
    }

    const sandbox =
      typeof this.props.sandbox === 'string'
        ? doc.sandbox(this.props.sandbox)()
        : this.props.sandbox || {}

    const wrapperStyle = {}

    if (!hideEditor) {
      if (position === 'above' || position === 'below') {
        wrapperStyle.width = '100%'
      } else if (position === 'left' || position === 'right') {
        wrapperStyle.width = '50%'
        wrapperStyle.float = 'left'
        wrapperStyle.margin = '0px'
      }
    }

    let children = [
      <div style={{ ...wrapperStyle, ...(String(hideEditor) === 'true' && { display: 'none' }) }}>
        <Editor {...this.props} />
      </div>,
      <div style={wrapperStyle}>
        <BlockRenderer {...this.props} doc={doc} line={this.props['data-line-number']} sandbox={sandbox} />
      </div>,
    ]

    if (position === 'above' || position === 'left' || position === 'before') {
      children = children.reverse()
    }

    return (
      <div style={{ display: 'block', clear: 'both' }}>
        <div style={{ clear: 'both' }}>{children}</div>
      </div>
    )
  }
}
