import React, { Component } from 'react'
import types from 'prop-types'
import { Switch, Route, BrowserRouter } from 'react-router-dom'
import HomePage from './pages/HomePage'
import runtime from './runtime'

import './App.css'

export default class App extends Component {
  static propTypes = {
    runtime: types.object,
  }

  static childContextTypes = {
    runtime: types.object,
  }

  static defaultProps = {
    runtime,
  }

  getChildContext() {
    return { runtime: this.props.runtime }
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={HomePage} />
        </Switch>
      </BrowserRouter>
    )
  }
}
