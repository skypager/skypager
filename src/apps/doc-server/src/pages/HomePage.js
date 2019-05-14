import React, { Component } from 'react'
import types from 'prop-types'
import { Button, Header, Container } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

export default class HomePage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  state = {
    docIds: [],
  }

  componentDidMount() {
    const { runtime } = this.context

    const docIds = runtime.mdxDocs.available

    this.setState({ docIds })

    this.disposer = runtime.state.observe(({ name, newValue }) => {
      if(name === 'docsLoaded' && newValue) {
        console.log('Got new Doc Ids', runtime.mdxDocs.available)
        this.setState({ docIds: runtime.mdxDocs.available })  
      } 
    })
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  render() {
    const { docIds } = this.state

    return (
      <Container style={{ padding: '48px' }}>
        {docIds.map(docId => (
          <Container key={docId}>
            <Link to={`/docs/${docId}`}>{docId}</Link>
          </Container>
        ))}
      </Container>
    )
  }
}
