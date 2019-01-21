import React from 'react'
import { Header } from 'semantic-ui-react'
import types from 'prop-types'

const Heading = (props = {}, context = {}) => {
  const { runtime } = context
  const { kebabCase } = runtime.stringUtils

  const toSlug = title =>
    kebabCase(
      title
        .toLowerCase()
        .replace(/\W+/, ' ')
        .replace(/\s/, '_')
        .replace(/__/, '_')
    )

  const headerProps = runtime.lodash.pick(props, 'className', 'style', 'class', 'as')

  return (
    <Header {...headerProps}>
      {typeof props.children === 'string' && <a name={toSlug(props.children)} />}
      {props.children}
    </Header>
  )
}

Heading.contextTypes = {
  runtime: types.object,
}

export default Heading
