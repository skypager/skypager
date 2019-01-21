import React, { Component } from 'react'
import types from 'prop-types'
import { Button, Container } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

export default class HomePage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  render() {
    return (
      <Container>
        <Button as={Link} content="Graph Explorer" to="/graph-explorer" />
      </Container>
    )
  }
}
