import React, { Component } from 'react'
import { Container } from 'semantic-ui-react'
import types from 'prop-types'

export default class MainLayout extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    sideMenu: types.any.isRequired,
  }

  render() {
    const { sideMenu: SideMenu } = this.props

    return (
      <Container fluid style={{ width: '100%', height: '100vh' }}>
        {this.props.children}
      </Container>
    )
  }
}
