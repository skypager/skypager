import React from 'react'
import { Link } from 'react-router-dom'

const DocLink = (props = {}) => {
  let { children, href } = props

  if (href && href.endsWith('.md')) {
    href = href.replace(/\.md$/, '')
  }

  if (href && href.startsWith('#')) {
    return <a href={href}>{children}</a>
  }

  return <Link to={href}>{children}</Link>
}

export default DocLink
