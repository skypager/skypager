import runtime from '@skypager/web'
import React, { Component } from 'react'
import types from 'prop-types'
import { Link, Switch, Route, BrowserRouter } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DocPage from './pages/DocPage'
import GraphExplorer from './components/GraphExplorer'
import MainLayout from './layouts/MainLayout'
import SideMenu from '../docs/_sideMenu.md'

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

  renderSideMenu() {
    const c = {
      a: props => <Link to={props.href}>{props.children}</Link>,
    }
    return <SideMenu components={c} />
  }

  render() {
    return (
      <BrowserRouter>
        <MainLayout
          sideMenu={() => this.renderSideMenu()}
          style={{ height: '100%', width: '100%' }}
        >
          <Switch>
            <Route path="/" exact component={HomePage} />
            <Route path="/graph-explorer" exact component={GraphExplorer} />
            <Route path="/docs/:docId" component={DocPage} />
          </Switch>
        </MainLayout>
      </BrowserRouter>
    )
  }
}
