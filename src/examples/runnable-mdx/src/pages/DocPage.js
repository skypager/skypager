import React, { Component } from 'react'
import types from 'prop-types'
import { Container } from 'semantic-ui-react'
import ActiveDocument from 'components/ActiveDocument'

export default class DocPage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  receiveDoc = (doc, component) => {
    window.$doc = doc
  }

  state = {
    docId: this.props.docId,
  }

  componentDidUpdate() {
    if (this.state.docId !== this.props.docId) {
      this.setState({ docId: this.props.docId })
    }
  }

  render() {
    return (
      <Container style={{ padding: '48px' }}>
        {this.state.docId && <ActiveDocument onLoad={this.receiveDoc} docId={this.state.docId} />}
      </Container>
    )
  }
}
