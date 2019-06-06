import React, { Children, Fragment, Component } from 'react'
import {
  Responsive,
  Sidebar,
  Button,
  Icon,
  Menu,
  Segment,
  Grid,
  Container,
} from 'semantic-ui-react'
import types from 'prop-types'
import { NavLink, Link } from 'react-router-dom'

function NavMenuItems({ toggle }) {
  return [
    <Menu.Item onClick={toggle} key="nav">
      <Icon name="bars" />
      Hide Menu
    </Menu.Item>,
    <Menu.Item key="home">
      <Icon name="home" />
      <NavLink to="/">Home</NavLink>
    </Menu.Item>,
    <Menu.Item key="apiDocs">
      <Icon name="file outline" />
      <NavLink to="/docs/api">API</NavLink>
    </Menu.Item>,
    <Menu.Item key="usage">
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

    <Menu.Item key="examples">
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
    <Menu.Item key="mdx">
      <Menu.Header>MDX Helper</Menu.Header>
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
    <Menu.Item key="babel">
      <Menu.Header>Babel Helper</Menu.Header>
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
    containerStyles: types.object
  }

  static defaultProps = {
    containerStyles: {
      marginLeft: '32px'
    }
  }

  state = {
    menuVisible: true,
  }

  toggleMenu = () => this.setState(c => ({ ...c, menuVisible: !c.menuVisible }))

  componentDidMount() {
    const { runtime } = this.props

    this.disposer = runtime.state.observe(({ name }) => {
      if (name === 'locationPathname') {
        this.setState({ menuVisible: false })
        window.scrollTo(0,0)
      }
    })
  }

  componentWillUnmount() {
    this.disposer && this.disposer()
  }

  renderDesktop() {
    const { children, containerStyles, showToggle } = this.props
    const { menuVisible } = this.state

    return (
      <Grid stackable doubling style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
        {menuVisible && (
          <Grid.Column stretched width={3} style={{ padding: 0 }}>
            <Sidebar
              as={Menu}
              vertical
              width="thin"
              direction="left"
              animation="push"
              icon="labeled"
              inverted
              onHide={() => this.setState({ menuVisible: false })}
              visible={menuVisible}
            >
              <NavMenuItems toggle={this.toggleMenu} />
            </Sidebar>       
          </Grid.Column>
        )}
        <Grid.Column width={menuVisible ? 13 : 16}>
          {!menuVisible && showToggle && (
            <div style={{ float: 'left' }}>
              <Button size="tiny" icon="bars" circular basic onClick={() => this.toggleMenu()} />
            </div>
          )}
          <div
            style={
              menuVisible
                ? { marginLeft: '16px', ...containerStyles }
                : { float: 'left', clear: 'right', ...containerStyles }
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
        <Sidebar
          as={Menu}
          vertical
          width="thin"
          direction="left"
          animation="push"
          icon="labeled"
          inverted
          onHide={() => this.setState({ menuVisible: false })}
          visible={menuVisible}
        >
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
        <Responsive minWidth={Responsive.onlyTablet.minWidth}>{this.renderDesktop()}</Responsive>
        <Responsive {...Responsive.onlyMobile}>{this.renderMobile()}</Responsive>
      </Fragment>
    )
  }
}
