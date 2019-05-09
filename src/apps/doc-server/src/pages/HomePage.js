import React, { Component } from 'react'
import types from 'prop-types'
import { Button, Header, Container } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

export default class HomePage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  render() {
    return <Container style={{ padding: '48px' }}>Hi</Container>
  }
}
