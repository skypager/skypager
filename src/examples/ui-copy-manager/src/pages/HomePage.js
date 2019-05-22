import React, { Component } from 'react'
import types from 'prop-types'
import { Button, Header, Container } from 'semantic-ui-react'

export default class HomePage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  render() {
    return (
      <Container id="home-page" style={{ padding: '48px' }}>
        <Header as="h1" content="Welcome to my Website" />
        <p>This is some paragraph copy about my website.</p>
        <p>This is some additional paragraph copy about my website.</p>
        <Button content="Click here to learn more" />
      </Container>
    )
  }
}
