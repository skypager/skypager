import React from 'react'
import types from 'prop-types'
import { Button } from 'semantic-ui-react'

export default function DocLink({ href = '', parentDocument, ...props }, context = {}) {
  const { runtime } = context

  if (!href || !href.length) {
    return <a {...props} />
  }

  if (parentDocument && href.startsWith('doc://')) {
    const docLink = parentDocument.resolveDocLink(href)

    if (docLink.matched) {
      const result = parentDocument.renderLinkTo({ ...docLink, props, matched: docLink.matched })
      return result
    } else {
      return <Button {...docLink.params}>{props.children}</Button>
    }
  }

  return <a href={href} {...props} />
}

DocLink.contextTypes = {
  runtime: types.object,
}
