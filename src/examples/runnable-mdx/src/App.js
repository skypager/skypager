import React, { Component } from 'react'
import types from 'prop-types'
import { Switch, Route, Router } from 'react-router-dom'
import DocPage from './pages/DocPage'
import SourceViewer from './components/SourceViewer'
import NavLayout from './components/NavLayout'
import runtime from './runtime'

import './App.css'

function docPage(docId, baseProps = {}) {
  return (props = {}) => <DocPage {...baseProps} {...props} docId={docId} />
}

function DocRoute(props = {}) {
  const docId = props.match.params.docId  
  return (
    <NavLayout runtime={props.runtime}>
      <DocPage {...props} docId={docId} />
    </NavLayout>
  )
}

function SourceRoute(props = {}) {
  const { fileType, sourceId } = props.match.params
  return (
    <NavLayout runtime={props.runtime} containerStyles={{ marginLeft: '0px,', margin: 0, padding: 0 }} showToggle={false}>
      <SourceViewer {...props} file={ fileType === 'docs' ? `docs/${sourceId}.md` : `src/${sourceId}.js`} lang={fileType === 'docs' ? 'markdown' : 'javascript'} />
    </NavLayout>  
  )
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
    const { runtime } = this.props

    return (
      <Router history={runtime.history}>
          <Switch>
>           <Route
              path="/docs/:docId*"
              exact
              render={(props) => <DocRoute {...props} runtime={runtime} />}
            />
 
            <Route
              path="/source/:fileType/:sourceId*"
              exact
              render={(props) => <SourceRoute {...props} runtime={runtime} />}
            />
 
            <Route path="/" exact component={docPage('README')} />
            <Route path="*" component={() => <div style={{ minHeight: '600px', height: '100%'}}><h1>Not Found</h1></div>} />
          </Switch>
      </Router>
    )
  }
}
