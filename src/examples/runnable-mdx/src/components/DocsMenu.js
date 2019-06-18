import React from 'react'
import types from 'prop-types'
import { Icon, Menu } from 'semantic-ui-react'
import { NavLink } from 'react-router-dom'

export default function DocsMenu({ toggle }, { runtime }) {
  const { omit, sortBy } = runtime.lodash
  const { docs } = runtime
  const { indexes = [] } = docs
  
  const menus = sortBy(indexes, (doc) => {
    console.log('sorting by', doc.meta && doc.meta.menu)
    return doc.meta && doc.meta.menu ? parseInt(doc.meta.menu.order, 10) : doc.title
  })
    .map((doc) => ({
      heading: doc.title,
      icon: doc.get('meta.menu.icon'),
      key: doc.name,
      children: docs.all.filter(({ name }) => name !== doc.name && name.startsWith(doc.name.replace('/index', ''))) 
    }))
  
  return menus.map((menu) => {
    return (
      <Menu.Item key={menu.key}>
        <Menu.Header>
          {menu.icon && menu.icon.length && <Icon name={menu.icon} />}
          {menu.heading}
        </Menu.Header>
        <Menu.Menu>
          {menu.children.map((child) => <Menu.Item as={NavLink} to={`/docs/${child.name}`} key={child.name}>{child.title}</Menu.Item>)}
        </Menu.Menu>
      </Menu.Item>    
    )
  })
}

DocsMenu.propTypes = {
  toggle: types.func
}

DocsMenu.contextTypes = {
  runtime: types.object
}