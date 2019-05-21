import React, { Component } from 'react'
import types from 'prop-types'
import { MDXProvider } from '@mdx-js/react'

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

  state = {
    components: this.props.components,
  }

  componentDidUpdate() {
    this.setState({ components: props.components })
  }

  render() {
    const { components } = this.state
    const { doc, Component = doc.Component } = this.props

    return (
      <MDXProvider components={components}>
        <Component />
      </MDXProvider>
    )
  }
}
