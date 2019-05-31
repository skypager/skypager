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

  componentDidUpdate() {
    const { runtime } = this.context

    const docsLoaded = runtime.currentState.docsLoaded

    console.log('DOC PAGE', docsLoaded)

    this.setState({ docsLoaded })

    if (!docsLoaded) {
      runtime.once('docsLoadedDidChangeState', (...args) => {
        console.log('YO YO DOCS LOADED', ...args)
        this.setState({ docsLoaded: true })
      })
    }

    if (this.state.docId !== this.props.docId) {
      this.setState({ docId: this.props.docId })
    }
  }

  render() {
    const { docsLoaded } = this.state

    return (
      <Fragment>
        <Responsive {...Responsive.onlyMobile}>
          <div id="page-container" className="mobile">
            {!docsLoaded && <Loader active />}
            {this.state.docId && (
              <ActiveDocument {...this.props} onLoad={this.receiveDoc} docId={this.state.docId} />
            )}
            <Segment basic clearing>
              <Button
                basic
                floated="right"
                content="View Source"
                as={Link}
                to={`/source/${this.state.docId}`}
              />
            </Segment>
          </div>
        </Responsive>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          <Container id="page-container">
            {!docsLoaded && <Loader active />}
            {this.state.docId && (
              <ActiveDocument {...this.props} onLoad={this.receiveDoc} docId={this.state.docId} />
            )}
            <Segment basic clearing>
              <Button
                floated="right"
                basic
                content="View Source"
                as={Link}
                to={`/source/${this.state.docId}`}
              />
            </Segment>
          </Container>
        </Responsive>
      </Fragment>
    )
  }
}
