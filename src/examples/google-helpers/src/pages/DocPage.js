import React, { Fragment, Component } from 'react'
import types from 'prop-types'
import { Segment, Button, Loader, Container, Responsive } from 'semantic-ui-react'
import ActiveDocument from 'components/ActiveDocument'
import { Link } from 'react-router-dom'

export default class DocPage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  receiveDoc = (doc, component) => {}

  state = {
    docId: this.props.docId,
    docsLoaded: true,
  }

  componentDidMount() {
    const { runtime } = this.context

    const docsLoaded = runtime.currentState.docsLoaded

    this.setState({ docsLoaded })

    if (!docsLoaded) {
      runtime.once('docsLoadedDidChangeState', ({ newValue }) => {
        this.setState({ docsLoaded: newValue })
      })
    }
  }

  componentDidUpdate() {
    console.log('DOC PAGE DID UPDATE', this.state.docId, this.props.docId)
    if (this.state.docId !== this.props.docId) {
      this.setState({ docId: this.props.docId })
    }
  }

  render() {
    const { docsLoaded } = this.state

    console.log('Rendering Doc Page', {
      docId: this.state.docId,
      docsLoaded: this.state.docsLoaded,
    })

    return (
      <Fragment>
        <Responsive {...Responsive.onlyMobile}>
          <div id="page-container" className="mobile">
            {!docsLoaded && <Loader active />}
            {this.state.docId && (
              <ActiveDocument {...this.props} onLoad={this.receiveDoc} docId={this.state.docId} />
            )}
          </div>
        </Responsive>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <div id="page-container" style={{ paddingRight: '16px' }}>
            {!docsLoaded && <Loader active />}
            {this.state.docId && (
              <ActiveDocument {...this.props} onLoad={this.receiveDoc} docId={this.state.docId} />
            )}
          </div>
        </Responsive>
      </Fragment>
    )
  }
}
