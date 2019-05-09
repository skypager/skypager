import React, { Component } from 'react'
import types from 'prop-types'

export default class Skypage extends Component {
  static contextTypes = {
    runtime: types.object,
  }

  static propTypes = {
    docType: types.string,
    /**
     * Pass it an instance of the @skypager/helpers-document class
     */
    doc: types.shape({
      id: types.string,
      name: types.string,
      Component: types.oneOf([types.element, types.func]),
      meta: types.object,
      ast: types.shape({
        children: types.array,
      }),
    }).isRequired,
  }

  static defaultProps = {
    docType: '@skypager/helpers-document',
    containerProps: {
      fluid: true,
    },
  }

  render() {
    const { doc, components } = this.props
    const { Component: Doc } = doc

    return <Doc components={components} />
  }
}
