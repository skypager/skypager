import React, { Component } from 'react'
import { Container } from 'semantic-ui-react'
import types from 'prop-types'

export default class App extends Component {
  static propTypes = {
    runtime: types.object,
  }
  render() {
    return <Container>Skypager</Container>
  }
}
