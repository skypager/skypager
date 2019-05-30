import React, { Fragment, Component } from 'react'
import types from 'prop-types'
import { Container, Responsive } from 'semantic-ui-react'
import ActiveDocument from 'components/ActiveDocument'

export default class DocPage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  receiveDoc = (doc, component) => {}

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
      <Fragment>
        <Responsive {...Responsive.onlyMobile}>
          <div id="page-container" className="mobile">
            {this.state.docId && (
              <ActiveDocument {...this.props} onLoad={this.receiveDoc} docId={this.state.docId} />
            )}
          </div>
        </Responsive>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <Container id="page-container">
            {this.state.docId && (
              <ActiveDocument {...this.props} onLoad={this.receiveDoc} docId={this.state.docId} />
            )}
          </Container>
        </Responsive>
      </Fragment>
    )
  }
}
