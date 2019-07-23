import React, { Component } from 'react'
import { Sidebar, Container } from 'semantic-ui-react'
import types from 'prop-types'

export default class DrawerLayout extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static defaultProps = {
    sidebars:[{ id: 'top' }, { id: 'right' }, { id: 'bottom' }, { id: 'left' }],
    styles: {},
    visibility: {},
    headerContent: undefined,
    footerContent: undefined 
  }

  state = {
    styles: this.props.styles,
    visibility: this.props.visibility
  }

  componentWillMount() {
    const { runtime } = this.context    
    const { workspace } = runtime

    workspace.drawers.observe(({ name, newValue }) => {
      this.setState((current) => ({ ...current, visibility: { ...current.visibility, [name]: !!newValue.visible }}))
    })
  }

  render() {
    const { children, sidebars = [], containerProps = {}, headerContent, footerContent } = this.props
    const { styles = {}, visibility = {} } = this.state
    const sidebarStyles = styles.sidebars || {}
    const innerSidebarStyles = styles.inner|| {}

    return (
      <Sidebar.Pushable
        as={Container}
        fluid
        style={{ height: "100%" }}
        {...containerProps}
      >
        {sidebars.map(({ id, direction = id, visible = !!visibility[id], width = '60%', height = '50% !important', styles = sidebarStyles[id] || {}, innerStyles = innerSidebarStyles[id], ...props}) => {
          return (
            <Sidebar
              key={id}
              as={Container}
              animation="overlay"
              {...props}
              {...(direction === 'top' || direction === 'bottom') && { width: 'very wide' }}
              visible={visible}
              direction={direction}
              style={{ ...(direction === "top" || direction === 'bottom') && { height }, ...(direction === 'left' || direction === 'right') && { width }, ... styles}}
            >
              <div style={{ height: '100%', width: '100%', margin: '0px', padding: '0px' }} id={`${id}-sidebar`}></div>
            </Sidebar>
          )
        })}
        <Sidebar.Pusher>
          {headerContent}
          {children}
          {footerContent}
        </Sidebar.Pusher>
      </Sidebar.Pushable>
    );    
  }
}