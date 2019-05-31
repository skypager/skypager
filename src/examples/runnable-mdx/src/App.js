import React, { Component } from 'react'
import types from 'prop-types'
import { Switch, Route, BrowserRouter } from 'react-router-dom'
import DocPage from './pages/DocPage'
import SourceViewer from './components/SourceViewer'
import HomePage from './pages/HomePage'
import runtime from './runtime'

import './App.css'

function docPage(docId, baseProps = {}) {
  return (props = {}) => <DocPage {...baseProps} {...props} docId={docId} />
}

function sourcePage(file, baseProps = {}) {
  return (props = {}) => <SourceViewer {...baseProps} {...props} file={file} lang="markdown" />
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
          <Route path="/source/runnable" exact component={sourcePage('docs/runnable.md')} />
          <Route path="/docs/renderable" exact component={docPage('renderable')} />
          <Route path="/source/renderable" exact component={sourcePage('docs/renderable.md')} />
          <Route path="/docs/site-template" exact component={docPage('site-template')} />
          <Route
            path="/source/site-template"
            exact
            component={sourcePage('docs/site-template.md')}
          />
          <Route path="/docs/unpkg" exact component={docPage('unpkg', { processImports: true })} />
          <Route path="/source/unpkg" exact component={sourcePage('docs/unpkg.md')} />
          <Route path="*" component={HomePage} />
        </Switch>
      </BrowserRouter>
    )
  }
}
