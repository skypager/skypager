import React, { Component } from 'react'
import types from 'prop-types'
import { Switch, Route, BrowserRouter } from 'react-router-dom'
import DocPage from './pages/DocPage'
import HomePage from './pages/HomePage'
import runtime from './runtime'

import './App.css'

function docPage(docId, baseProps = {}) {
  return (props = {}) => <DocPage {...baseProps} {...props} docId={docId} />
}

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
          <Route path="/docs/runnable" exact component={docPage('runnable')} />
          <Route path="/docs/renderable" exact component={docPage('renderable')} />
          <Route path="/docs/site-template" exact component={docPage('site-template')} />
          <Route path="/docs/unpkg" exact component={docPage('unpkg', { processImports: true })} />
          <Route path="*" component={HomePage} />
        </Switch>
      </BrowserRouter>
    )
  }
}
