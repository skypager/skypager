import React, { Component } from 'react'
import types from 'prop-types'
import { Link, Switch, Route, BrowserRouter } from 'react-router-dom'
import runtime from '@skypager/web'
import HomePage from './pages/HomePage'

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
          <Route path="*" component={HomePage} />
        </Switch>
      </BrowserRouter>
    )
  }
}
