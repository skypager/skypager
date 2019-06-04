import React, { Children, Fragment, Component } from 'react'
import { Responsive, Sidebar, Button, Icon, Menu, Segment, Grid, Container } from 'semantic-ui-react'
import types from 'prop-types'
import { NavLink, Link } from 'react-router-dom'

function NavMenuItems({ toggle }) {
  return [
    <Menu.Item onClick={toggle}>
      <Icon name="bars" />
      Hide Menu
    </Menu.Item>,
    <Menu.Item>
      <Icon name="home" />
      <NavLink to="/">Home</NavLink>
    </Menu.Item>,
    <Menu.Item>
      <Icon name="file outline" />
      <NavLink to="/docs/api">API</NavLink>
    </Menu.Item>,
    <Menu.Item>
      <Menu.Header>Usage</Menu.Header>
      <Menu.Menu>
        <Menu.Item as={NavLink} to="/#usage-in-node">
          Node Usage
        </Menu.Item>
        <Menu.Item as={NavLink} to="/#browser-usage">
          Browser Usage
        </Menu.Item>
      </Menu.Menu>
    </Menu.Item>,

    <Menu.Item>
      <Menu.Header>Examples</Menu.Header>
      <Menu.Menu>
        <Menu.Item as={NavLink} to="/docs/renderable">
          Renderable Blocks
        </Menu.Item>
        <Menu.Item as={NavLink} to="/docs/runnable">
          Runnable Blocks
        </Menu.Item>
        <Menu.Item as={NavLink} to="/docs/unpkg">
          NPM Dependenicies
        </Menu.Item>
      </Menu.Menu>
    </Menu.Item>,
    <Menu.Item>
      <Menu.Header>MDX Document Helper</Menu.Header>
      <Menu.Menu>
        <Menu.Item as={NavLink} to="/docs/magic-link-syntax">
          Magic Link Syntax
        </Menu.Item>
        <Menu.Item as={NavLink} to="/docs/actions">
          Actions
        </Menu.Item>
        <Menu.Item as={NavLink} to="/docs/block-contexts">
          Block Contexts
        </Menu.Item>
        <Menu.Item as={NavLink} to="/docs/metadata">
          Metadata
        </Menu.Item>
      </Menu.Menu>
    </Menu.Item>,
    <Menu.Item>
      <Menu.Header>Babel Source Helper</Menu.Header>
      <Menu.Menu>
        <Menu.Item as={NavLink} to="/docs/babel-module-analysis">
          Module Analysis
        </Menu.Item>
        <Menu.Item as={NavLink} to="/docs/babel-queries">
          AST Queries
        </Menu.Item>
      </Menu.Menu>
    </Menu.Item>,
  ]
}
export default class NavLayout extends Component {
  static propTypes = {
    runtime: types.object,
  }

  state = {
    menuVisible: true,
  }

  toggleMenu = () => this.setState(c => ({ ...c, menuVisible: !c.menuVisible }))

  componentDidMount() {
    const { runtime } = this.props

    this.disposer = runtime.state.observe(({ name }) => {
      if (name === 'location') {
        this.setState({ menuVisible: false })
      }
    })
  }

  componentWillUnmount() {
    this.disposer && this.disposer()    
  }

  renderDesktop() {
    const { children } = this.props
    const { menuVisible } = this.state

    return (
      <Grid stackable doubling style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
        {menuVisible && (
          <Grid.Column stretched width={3} style={{ padding: 0 }}>
            <Menu as={Segment} vertical inverted labeled="icon">
              <NavMenuItems toggle={this.toggleMenu} />
            </Menu>
          </Grid.Column>
        )}
        <Grid.Column width={menuVisible ? 13 : 16}>
          {!menuVisible && (
            <div style={{ float: 'left' }}>
              <Button size="tiny" icon="bars" circular basic onClick={() => this.toggleMenu()} />
            </div>
          )}
          <div
            style={
              menuVisible
                ? { marginLeft: '16px' }
                : { float: 'left', clear: 'right', marginLeft: '32px' }
            }
          >
            {Children.only(children)}
          </div>
        </Grid.Column>
      </Grid>
    )
  }

  renderMobile() {
    const { children } = this.props
    const { menuVisible } = this.state

    return (
      <Sidebar.Pushable as={Segment}>
        <Sidebar as={Menu} vertical width="thin" direction="left" animation="push" icon="labeled" inverted onHide={() => this.setState({ menuVisible: false })} visible={menuVisible}>
          <NavMenuItems toggle={this.toggleMenu} />
        </Sidebar>
        <Sidebar.Pusher>
          {!menuVisible && <Button basic onClick={this.toggleMenu} icon="bars" circular />}
          {Children.only(children)}          
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    )
  }

  render() {
    return (
      <Fragment>
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>
          {this.renderDesktop()}
        </Responsive>   
        <Responsive {...Responsive.onlyMobile}>
          {this.renderMobile()}
        </Responsive>          
      </Fragment>
    )
  }
}
