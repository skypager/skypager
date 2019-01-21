import React, { createElement, Component } from 'react'
import types from 'prop-types'
import { MdxComponents } from 'components/Documentation'
import Editable from 'components/Documentation/Editable'
import Code from 'components/Documentation/Code'

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
    const { runtime } = this.context
    const { doc, containerProps } = this.props
    const { meta } = doc

    const editable = this.props.editable
      ? this.props.editable
      : meta && meta.editable && this.props.editable !== false

    const components = {
      ...MdxComponents,
      pre: props => <div {...props} />,
      inlineCode: props => (
        <code style={{ color: '#f40fac' }}>
          <em {...props} />
        </code>
      ),
      code: props =>
        editable ? <Editable {...props} editable /> : <Code {...props} runtime={runtime} />,
    }

    return createElement(doc.Component, { components })
  }
}
